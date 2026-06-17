package com.geoquiz.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geoquiz.entity.*;
import com.geoquiz.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.*;
import java.util.zip.ZipInputStream;
import java.util.Iterator;

@Service
public class DataRefreshService {

    private static final Logger log = LoggerFactory.getLogger(DataRefreshService.class);

    private static final Map<String, Integer> DIFFICULTY_MAP;
    static {
        DIFFICULTY_MAP = new HashMap<>();
        // Difficulty 1 — Very Easy
        for (String iso : new String[]{"US","GB","FR","DE","IT","ES","CN","JP","IN","BR","CA","AU","RU","MX","KR","NL","SE","NO","CH","AR"}) {
            DIFFICULTY_MAP.put(iso, 1);
        }
        // Difficulty 2 — Easy
        for (String iso : new String[]{"PT","BE","AT","DK","FI","PL","CZ","HU","RO","UA","TR","EG","ZA","NG","KE","SA","AE","IL","TH","ID","VN","PH","NZ","IE","GR","CL","CO","PE","VE","CU","MA","DZ","ET","GH","SG","MY","IQ","IR","SY","LB"}) {
            DIFFICULTY_MAP.put(iso, 2);
        }
        // Difficulty 3 — Medium
        for (String iso : new String[]{"BY","SK","HR","RS","BG","LT","LV","EE","SI","BA","AL","MK","MD","GE","AM","AZ","KZ","UZ","AF","PK","BD","LK","NP","MM","KH","TN","LY","SD","ZW","TZ","UG","AO","MZ","CM","CI","SN","EC","BO","PY","UY","HN","GT","CR","PA","JM","HT","DO","JO","KW","QA","BH","OM","YE","LU","MT","IS","CY","LI","MC","MN"}) {
            DIFFICULTY_MAP.put(iso, 3);
        }
        // Difficulty 4 — Hard
        for (String iso : new String[]{"ME","XK","SM","VA","TJ","KG","TM","LA","BN","TL","PG","FJ","VU","SB","WS","TO","KI","MH","FM","PW","NR","TV","DJ","ER","SO","KM","MG","MU","SC","MV","BT","SR","GY","BZ","TT","BB","GD","LC","AG","DM","KN","VC","CV","GM","GW","SL","LR","TG","BJ","BF","NE","ML","TD","MR","GN","GQ","GA","ST","BI","RW","MW","ZM","NA","BW","SZ","LS","CF","SS","CG","CD"}) {
            DIFFICULTY_MAP.put(iso, 4);
        }
        // Everything else defaults to 5 via getOrDefault
    }

    // Country metadata - mledoze/countries (same schema as deprecated REST Countries v3.1)
    private static final String COUNTRIES_DATA_URL =
            "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";

    // Flag images - flagcdn.com, keyed by lowercase ISO A2 (e.g. "us", "gb")
    private static final String FLAG_PNG_TEMPLATE = "https://flagcdn.com/w320/%s.png";
    private static final String FLAG_SVG_TEMPLATE = "https://flagcdn.com/%s.svg";

    // Country boundary polygons - datasets/geo-countries (public domain, 258 features)
    // Properties: name, ISO3166-1-Alpha-2, ISO3166-1-Alpha-3
    private static final String GEOJSON_URL =
            "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

    // Non-capital city data - GeoNames cities5000 public dump (no API key needed)
    // Tab-separated: col 1=name, 6=feature_class, 7=feature_code, 8=country_code, 14=population
    // feature_code PPLC = capital (skip); P* = populated place (keep)
    private static final String CITIES_ZIP_URL =
            "https://download.geonames.org/export/dump/cities5000.zip";

    private final CountryRepository countryRepository;
    private final CountryAliasRepository aliasRepository;
    private final CityRepository cityRepository;
    private final CountryBoundaryRepository boundaryRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${data.refresh.enabled:true}")
    private boolean refreshEnabled;

    public DataRefreshService(CountryRepository countryRepository,
                               CountryAliasRepository aliasRepository,
                               CityRepository cityRepository,
                               CountryBoundaryRepository boundaryRepository,
                               ObjectMapper objectMapper) {
        this.countryRepository = countryRepository;
        this.aliasRepository = aliasRepository;
        this.cityRepository = cityRepository;
        this.boundaryRepository = boundaryRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(60))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedOnStartup() {
        if (!refreshEnabled) return;
        boolean needCountries = countryRepository.count() == 0;
        boolean needBoundaries = boundaryRepository.count() == 0;
        boolean needCities = cityRepository.countNonCapitals() == 0;

        if (!needCountries && !needBoundaries && !needCities) {
            log.info("All data present - skipping seed");
            return;
        }

        log.info("Seeding: countries={}, boundaries={}, cities={}", needCountries, needBoundaries, needCities);

        if (needCountries) {
            try { refreshCountries(); }
            catch (Exception e) { log.error("Country seed failed: {}", e.getMessage(), e); }
        }
        if (needBoundaries) {
            try { refreshBoundaries(); }
            catch (Exception e) { log.error("Boundary seed failed: {}", e.getMessage(), e); }
        }
        if (needCities) {
            try { refreshCities(); }
            catch (Exception e) { log.error("City seed failed: {}", e.getMessage(), e); }
        }
    }

    @Scheduled(cron = "0 0 2 * * *")
    public void scheduledRefresh() {
        if (!refreshEnabled) return;
        log.info("Starting scheduled data refresh");
        try { refreshCountries(); } catch (Exception e) { log.error("Scheduled country refresh failed", e); }
        try { refreshBoundaries(); } catch (Exception e) { log.error("Scheduled boundary refresh failed", e); }
        try { refreshCities(); } catch (Exception e) { log.error("Scheduled city refresh failed", e); }
    }

    @Transactional
    public void refreshAll() throws Exception {
        refreshCountries();
        refreshBoundaries();
        refreshCities();
    }

    // Countries

    @Transactional
    public void refreshCountries() throws Exception {
        log.info("Fetching country data from mledoze/countries");
        String body = get(COUNTRIES_DATA_URL, 30);
        JsonNode root = objectMapper.readTree(body);
        int count = 0;
        for (JsonNode node : root) {
            try { upsertCountry(node); count++; }
            catch (Exception e) { log.warn("Country node failed: {}", e.getMessage()); }
        }
        log.info("Refreshed {} countries", count);
    }

    private void upsertCountry(JsonNode node) {
        String isoA2 = node.path("cca2").asText(null);
        if (isoA2 == null || isoA2.isBlank()) return;

        Country c = countryRepository.findByIsoA2IgnoreCase(isoA2).orElse(new Country());
        c.setIsoA2(isoA2);
        c.setIsoA3(node.path("cca3").asText(null));

        JsonNode name = node.path("name");
        c.setNameCommon(name.path("common").asText(null));
        c.setNameOfficial(name.path("official").asText(null));
        c.setRegion(node.path("region").asText(null));
        c.setSubregion(node.path("subregion").asText(null));

        JsonNode capitals = node.path("capital");
        if (capitals.isArray() && capitals.size() > 0) c.setCapital(capitals.get(0).asText(null));

        String iso = isoA2.toLowerCase();
        c.setFlagSvgUrl(String.format(FLAG_SVG_TEMPLATE, iso));
        c.setFlagPngUrl(String.format(FLAG_PNG_TEMPLATE, iso));

        // flagEmoji
        c.setFlagEmoji(node.path("flag").asText(null));

        // currencies — take the first currency entry
        JsonNode curs = node.path("currencies");
        if (curs.isObject() && curs.size() > 0) {
            Iterator<Map.Entry<String, JsonNode>> curIt = curs.fields();
            Map.Entry<String, JsonNode> curEntry = curIt.next();
            String code = curEntry.getKey();
            JsonNode first = curEntry.getValue();
            c.setCurrencyCode(code);
            c.setCurrencyName(first.path("name").asText(null));
            c.setCurrencySymbol(first.path("symbol").asText(null));
        }

        // languages — store as JSON array of values
        JsonNode langs = node.path("languages");
        if (langs.isObject() && langs.size() > 0) {
            List<String> langList = new ArrayList<>();
            langs.fields().forEachRemaining(e -> langList.add(e.getValue().asText()));
            try {
                c.setLanguages(objectMapper.writeValueAsString(langList));
            } catch (Exception ex) {
                log.warn("Failed to serialize languages for {}: {}", isoA2, ex.getMessage());
            }
        }

        // borders — store JSON array as-is
        JsonNode bordersNode = node.path("borders");
        if (bordersNode.isArray()) {
            try {
                c.setBorders(objectMapper.writeValueAsString(bordersNode));
            } catch (Exception ex) {
                log.warn("Failed to serialize borders for {}: {}", isoA2, ex.getMessage());
                c.setBorders("[]");
            }
        } else {
            c.setBorders("[]");
        }

        c.setUpdatedAt(Instant.now());
        if (c.getId() == null) {  // new record only
            c.setDifficulty(DIFFICULTY_MAP.getOrDefault(isoA2.toUpperCase(), 5));
        }
        c = countryRepository.save(c);

        aliasRepository.deleteByCountryId(c.getId());
        Set<String> seen = new HashSet<>();
        seen.add(c.getNameCommon() != null ? c.getNameCommon().toLowerCase() : "");
        List<CountryAlias> aliases = new ArrayList<>();

        JsonNode translations = node.path("translations");
        for (Iterator<Map.Entry<String, JsonNode>> it = translations.fields(); it.hasNext();) {
            Map.Entry<String, JsonNode> entry = it.next();
            addAlias(aliases, c, entry.getValue().path("common").asText(null),
                    "translation-" + entry.getKey(), seen);
        }
        JsonNode altSpellings = node.path("altSpellings");
        if (altSpellings.isArray()) {
            for (JsonNode alt : altSpellings) addAlias(aliases, c, alt.asText(null), "altSpelling", seen);
        }
        aliasRepository.saveAll(aliases);

        if (c.getCapital() != null && !c.getCapital().isBlank()) {
            if (cityRepository.findByCountryIdAndIsCapitalTrue(c.getId()).isEmpty()) {
                City capital = new City();
                capital.setCountry(c);
                capital.setName(c.getCapital());
                capital.setCapital(true);
                capital.setPopulation(0L);
                cityRepository.save(capital);
            }
        }
    }

    private void addAlias(List<CountryAlias> list, Country c, String text, String source, Set<String> seen) {
        if (text == null || text.isBlank() || !seen.add(text.toLowerCase())) return;
        CountryAlias a = new CountryAlias();
        a.setCountry(c);
        a.setAlias(text);
        a.setSource(source);
        list.add(a);
    }

    // Boundaries

    @Transactional
    public void refreshBoundaries() throws Exception {
        log.info("Fetching country boundaries from datasets/geo-countries");
        String body = get(GEOJSON_URL, 60);
        JsonNode root = objectMapper.readTree(body);
        JsonNode features = root.path("features");
        int count = 0;
        for (JsonNode feature : features) {
            try {
                JsonNode props = feature.path("properties");
                String isoA2 = props.path("ISO3166-1-Alpha-2").asText(null);
                if (isoA2 == null || isoA2.isBlank() || isoA2.equals("-99")) continue;

                Optional<Country> opt = countryRepository.findByIsoA2IgnoreCase(isoA2);
                if (opt.isEmpty()) continue;
                Country country = opt.get();

                String geometryJson = objectMapper.writeValueAsString(feature.path("geometry"));

                CountryBoundary boundary = boundaryRepository.findByCountryId(country.getId())
                        .orElse(new CountryBoundary());
                boundary.setCountry(country);
                boundary.setGeojson(geometryJson);
                boundary.setSimplifiedGeojson(geometryJson);
                boundary.setUpdatedAt(Instant.now());
                boundaryRepository.save(boundary);
                count++;
            } catch (Exception e) {
                log.warn("Boundary feature failed: {}", e.getMessage());
            }
        }
        log.info("Refreshed {} country boundaries", count);
    }

    // Cities - GeoNames cities5000 public dump, no API key required

    @Transactional
    public void refreshCities() throws Exception {
        log.info("Fetching city data from GeoNames cities5000 dump");

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(CITIES_ZIP_URL))
                .timeout(Duration.ofSeconds(120))
                .GET()
                .build();
        HttpResponse<InputStream> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofInputStream());
        if (resp.statusCode() != 200)
            throw new RuntimeException("GeoNames cities5000 returned: " + resp.statusCode());

        // Parse ZIP stream: country_code -> list of (name, population)
        Map<String, List<long[]>> popMap = new HashMap<>();   // value[0]=pop, value[1]=nameIndex
        Map<String, List<String>> nameMap = new HashMap<>();

        try (ZipInputStream zip = new ZipInputStream(resp.body())) {
            zip.getNextEntry();
            BufferedReader reader = new BufferedReader(new InputStreamReader(zip, "UTF-8"));
            String line;
            while ((line = reader.readLine()) != null) {
                String[] cols = line.split("\t", -1);
                if (cols.length < 15) continue;
                if (!cols[6].equals("P")) continue;       // only populated places
                if (cols[7].equals("PPLC")) continue;     // skip capitals
                String cc = cols[8];
                String cityName = cols[1];
                long pop;
                try { pop = Long.parseLong(cols[14]); } catch (NumberFormatException e) { continue; }

                List<String> names = nameMap.computeIfAbsent(cc, k -> new ArrayList<>());
                List<long[]> pops = popMap.computeIfAbsent(cc, k -> new ArrayList<>());
                pops.add(new long[]{pop, names.size()});
                names.add(cityName);
            }
        }

        int cityCount = 0;
        for (String cc : nameMap.keySet()) {
            Optional<Country> opt = countryRepository.findByIsoA2IgnoreCase(cc);
            if (opt.isEmpty()) continue;
            Country country = opt.get();
            String capitalLower = country.getCapital() != null ? country.getCapital().toLowerCase() : "";

            List<long[]> pops = popMap.get(cc);
            List<String> names = nameMap.get(cc);
            pops.sort((a, b) -> Long.compare(b[0], a[0]));  // sort by pop desc

            cityRepository.deleteNonCapitalsByCountryId(country.getId());

            int saved = 0;
            for (long[] entry : pops) {
                if (saved >= 3) break;
                String cityName = names.get((int) entry[1]);
                if (cityName.toLowerCase().equals(capitalLower)) continue;
                City city = new City();
                city.setCountry(country);
                city.setName(cityName);
                city.setCapital(false);
                city.setPopulation(entry[0]);
                cityRepository.save(city);
                saved++;
                cityCount++;
            }
        }
        log.info("Refreshed {} non-capital cities", cityCount);
    }

    // HTTP helper

    private String get(String url, int timeoutSeconds) throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .GET()
                .build();
        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) throw new RuntimeException(url + " returned " + resp.statusCode());
        return resp.body();
    }
}
