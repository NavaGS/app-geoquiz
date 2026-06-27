import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as d3 from 'd3'
import QuizHeader from '../components/QuizHeader.jsx'
import QuestionTimer from '../components/QuestionTimer.jsx'
import { useQuizCore } from '../hooks/useQuizCore.js'
import { api } from '../api/client.js'
import { getRegion } from '../utils/regionSettings.js'
import { useTheme } from '../contexts/ThemeContext.jsx'

// Pixel diagonal threshold below which a popout inset is shown (covers micro-nations & small islands)
const SMALL_COUNTRY_PX = 40

export default function MapQuiz() {
  const region = getRegion()
  const { theme } = useTheme()

  const colors = useMemo(() => theme === 'dark'
    ? { water: '#0A1628', country: '#1A2744', highlight: '#4F70FF', highlightStroke: '#6B87FF', popoutFill: '#4F70FF', accent: '#6B87FF' }
    : { water: '#C8D8EC', country: '#E4E9F0', highlight: '#60A5FA', highlightStroke: '#1B3FE4', popoutFill: '#1B3FE4', accent: '#1B3FE4' },
    [theme]
  )

  const containerRef = useRef()
  const svgRef = useRef()
  const projRef = useRef(null)
  const pathGenRef = useRef(null)
  const geojsonRef = useRef(null)

  const [geojson, setGeojson] = useState(null)
  const [geoLoading, setGeoLoading] = useState(true)

  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [flashState, setFlashState] = useState(null)
  const [revealName, setRevealName] = useState(null)
  const inputRef = useRef()
  const isSkippingRef = useRef(false)

  // MapQuiz question timer expire shows wrong flash + reveals country name instead of
  // flipping a card. We wire the implementation via a ref so it can reference the
  // hook's refs after useQuizCore has run.
  const questionExpireImplRef = useRef(null)

  const {
    current, loading: countriesLoading, error,
    queueSize, qIndex, gp,
    flipped, setFlipped,
    score, historyRef, submitAnswer, recordResult,
    sessionTimer, questionTimer,
    advanceRef, advanceQueue, currentRef, questionGenRef,
    beginSubmit, endSubmit,
  } = useQuizCore({
    mode: 'map',
    region,
    filterFn: c => !!c.hasBoundary,
    getIso: c => c.isoA2,
    getCanonical: c => c.nameCommon,
    // Stable wrapper; the real body is kept current via questionExpireImplRef
    onQuestionExpire: useCallback(() => { questionExpireImplRef.current?.() }, []),
  })

  // Always points to the latest version of the expire logic (captures fresh refs/closures)
  useEffect(() => {
    questionExpireImplRef.current = () => {
      const c = currentRef.current
      if (!c) return
      const gen = questionGenRef.current
      recordResult(c.isoA2, 'SKIP', c.nameCommon, null, null)  // recordResult is settledRecord from hook
      setFlashState('wrong')
      setRevealName(c.nameCommon)
      setTimeout(() => {
        if (questionGenRef.current !== gen) return
        advanceRef.current?.()
      }, 2000)
    }
  })

  // Load world GeoJSON independently (parallel to countries fetch)
  useEffect(() => {
    setGeoLoading(true)
    api.getWorldGeoJson(region)
      .then(data => {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data
        geojsonRef.current = parsed
        setGeojson(parsed)
        setGeoLoading(false)
      })
      .catch(e => { console.error('GeoJSON load failed:', e); setGeoLoading(false) })
  }, [region])

  const loading = countriesLoading || geoLoading

  function advance() {
    isSkippingRef.current = false
    setAnswer('')
    setFeedback(null)
    setFlashState(null)
    setRevealName(null)
    advanceQueue()
  }
  useEffect(() => { advanceRef.current = advance })

  // ── D3 rendering helpers ──────────────────────────────────────────────────────

  function buildProjection(width, height, geoData) {
    const proj = d3.geoNaturalEarth1().fitSize([width, height], geoData)
    projRef.current = proj
    pathGenRef.current = d3.geoPath().projection(proj)
    return { proj, pathGen: pathGenRef.current }
  }

  function drawBase(svg, width, height, geoData, proj, pathGen, clrs) {
    svg.selectAll('*').remove()
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', clrs.water)
    const g = svg.append('g').attr('class', 'world')
    g.selectAll('path')
      .data(geoData.features || [])
      .join('path')
      .attr('d', pathGen)
      .attr('fill', clrs.country)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.4)
  }

  function drawHighlight(svg, width, height, geoData, pathGen, isoA2, clrs) {
    svg.selectAll('.highlight-layer').remove()
    const highlighted = geoData.features?.find(f => f.properties?.isoA2 === isoA2)
    if (!highlighted) return

    const layer = svg.append('g').attr('class', 'highlight-layer')
    svg.select('g.world').selectAll('path')
      .attr('fill', d => d.properties?.isoA2 === isoA2 ? clrs.highlight : clrs.country)
      .attr('stroke', d => d.properties?.isoA2 === isoA2 ? clrs.highlightStroke : '#ffffff')
      .attr('stroke-width', d => d.properties?.isoA2 === isoA2 ? 1 : 0.4)

    layer.append('path')
      .datum(highlighted)
      .attr('d', pathGen)
      .attr('fill', 'none')
      .attr('stroke', clrs.highlightStroke)
      .attr('stroke-width', 3)
      .attr('opacity', 0.35)

    let bounds
    try { bounds = pathGen.bounds(highlighted) } catch { return }
    const [[x0, y0], [x1, y1]] = bounds
    const diagonal = Math.hypot(x1 - x0, y1 - y0)
    if (diagonal < SMALL_COUNTRY_PX) {
      drawPopout(layer, svg, width, height, highlighted, pathGen, x0, y0, x1, y1, clrs)
    }
  }

  function drawPopout(layer, svg, width, height, feature, _mainPathGen, x0, y0, x1, y1, clrs) {
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    const IW = 240, IH = 190, MARGIN = 16

    let ix = width - IW - MARGIN
    let iy = height - IH - MARGIN
    if (cx > width * 0.6 && cy > height * 0.6)      { ix = MARGIN;              iy = MARGIN }
    else if (cx > width * 0.6)                        { ix = MARGIN;              iy = height - IH - MARGIN }
    else if (cy > height * 0.6)                       { ix = width - IW - MARGIN; iy = MARGIN }

    const insetCx = ix + IW / 2
    const insetCy = iy + IH / 2
    const lineStartX = cx < insetCx ? ix : ix + IW
    const lineStartY = cy < insetCy ? iy : iy + IH

    layer.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 4).attr('fill', clrs.accent).attr('stroke', '#fff').attr('stroke-width', 1.5)
    layer.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 4).attr('fill', 'none').attr('stroke', clrs.accent).attr('stroke-width', 2).attr('opacity', 0.8)
      .call(sel => {
        function pulse() {
          sel.attr('r', 4).attr('opacity', 0.8).transition().duration(1200).attr('r', 18).attr('opacity', 0).on('end', pulse)
        }
        pulse()
      })
    layer.append('line')
      .attr('x1', lineStartX).attr('y1', lineStartY).attr('x2', cx).attr('y2', cy)
      .attr('stroke', clrs.accent).attr('stroke-width', 1.5).attr('stroke-dasharray', '5,3').attr('opacity', 0.7)

    const inset = layer.append('g').attr('transform', `translate(${ix},${iy})`)
    inset.append('rect').attr('width', IW).attr('height', IH).attr('rx', 6).attr('fill', 'var(--bg-surface)').attr('stroke', 'var(--border)').attr('stroke-width', 1.5)

    const filterId = 'inset-shadow'
    if (svg.select(`#${filterId}`).empty()) {
      const defs = svg.append('defs')
      const filter = defs.append('filter').attr('id', filterId)
      filter.append('feDropShadow').attr('dx', 0).attr('dy', 2).attr('stdDeviation', 4).attr('flood-opacity', 0.2)
    }
    inset.attr('filter', `url(#${filterId})`)

    const centroid = d3.geoCentroid(feature)
    const insetProj = d3.geoAzimuthalEqualArea()
      .rotate([-centroid[0], -centroid[1]])
      .fitExtent([[8, 8], [IW - 8, IH - 22]], feature)
    const insetPath = d3.geoPath().projection(insetProj)

    inset.append('path').datum(feature).attr('d', insetPath).attr('fill', clrs.popoutFill).attr('stroke', '#fff').attr('stroke-width', 1)
    inset.append('text').attr('x', IW / 2).attr('y', IH - 5).attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', 'var(--text-muted)').attr('opacity', 0.7).text('zoomed view')
  }

  // Render map when geojson or current question changes
  useEffect(() => {
    if (!geojson || !svgRef.current || !current) return
    const el = svgRef.current
    const width = el.clientWidth || window.innerWidth
    const height = el.clientHeight || window.innerHeight
    const svg = d3.select(el)
    if (!projRef.current) {
      const { proj, pathGen } = buildProjection(width, height, geojson)
      drawBase(svg, width, height, geojson, proj, pathGen, colors)
    }
    drawHighlight(svg, width, height, geojson, pathGenRef.current, current.isoA2, colors)
  }, [geojson, current, colors])

  // Redraw on theme change
  useEffect(() => {
    if (!geojson || !svgRef.current || !projRef.current) return
    const el = svgRef.current
    const width = el.clientWidth || window.innerWidth
    const height = el.clientHeight || window.innerHeight
    const svg = d3.select(el)
    drawBase(svg, width, height, geojson, projRef.current, pathGenRef.current, colors)
    if (current) drawHighlight(svg, width, height, geojson, pathGenRef.current, current.isoA2, colors)
  }, [colors])

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry || !geojsonRef.current || !svgRef.current) return
      const width = entry.contentRect.width
      const height = entry.contentRect.height
      if (width < 10 || height < 10) return
      const svg = d3.select(svgRef.current)
      const { proj, pathGen } = buildProjection(width, height, geojsonRef.current)
      drawBase(svg, width, height, geojsonRef.current, proj, pathGen, colors)
      if (current) drawHighlight(svg, width, height, geojsonRef.current, pathGen, current.isoA2, colors)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [current, colors])

  // ── Answer handlers ───────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!answer.trim() || !current || feedback) return
    if (!beginSubmit()) return
    questionTimer.stop()
    const result = await submitAnswer(current.isoA2, answer)
    if (result.result === 'CORRECT') {
      setFlashState('correct')
      setFeedback(result)
      recordResult(current.isoA2, 'CORRECT', result.canonicalName, answer, null)
      setTimeout(() => advanceRef.current?.(), 1200)
    } else if (result.result === 'CLOSE') {
      endSubmit()
      setFlashState('close')
      setFeedback(result)
    } else {
      endSubmit()
      setFlashState('wrong')
      setRevealName(current.nameCommon)
      recordResult(current.isoA2, 'WRONG', current.nameCommon, answer, null)
      setTimeout(() => advanceRef.current?.(), 2000)
    }
  }

  function handleConfirmClose() {
    recordResult(current.isoA2, 'CORRECT', feedback.canonicalName, answer, null)
    setTimeout(() => advanceRef.current?.(), 800)
  }

  function handleRetry() {
    setFeedback(null)
    setFlashState(null)
    setRevealName(null)
    setAnswer('')
    if (gp?.mode === 'maxquestions' && gp.perQuestionTimer) {
      questionTimer.startFrom(gp.perQuestionSecs)
    }
  }

  function handleSkip() {
    if (isSkippingRef.current) return
    isSkippingRef.current = true
    questionTimer.stop()
    recordResult(current.isoA2, 'SKIP', current.nameCommon, null, null)
    setFlashState('wrong')
    setRevealName(current.nameCommon)
    setTimeout(() => advanceRef.current?.(), 2000)
  }

  if (loading) return <div className="min-h-screen bg-base flex items-center justify-center text-muted">Loading map…</div>
  if (error)   return <div className="min-h-screen bg-base flex items-center justify-center text-error">{error}</div>
  if (!current) return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-4">
      <p className="text-xl font-semibold text-primary">No countries found</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90">Retry</button>
    </div>
  )

  const showQTimer = gp.mode === 'maxquestions' && gp.perQuestionTimer
  const isInputDisabled = (!!feedback && feedback.result !== 'CLOSE') || !!revealName
  const inputBorderClass =
    flashState === 'correct' ? 'border-success ring-2 ring-success/30' :
    flashState === 'wrong'   ? 'border-error ring-2 ring-error/30' :
    'border-border-col focus:border-accent focus:ring-2'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <QuizHeader modeName="World Map" region={region} score={score} sessionTimer={sessionTimer} gp={gp} qIndex={qIndex} total={queueSize} />

      {showQTimer && (
        <div className="flex-none w-full">
          <QuestionTimer remaining={questionTimer.remaining} total={gp.perQuestionSecs} startKey={qIndex} />
        </div>
      )}

      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <svg ref={svgRef} className="w-full h-full block" />
      </div>

      <div className="flex-none bg-surface border-t border-border-col px-4 py-3 z-10">
        <p className="text-xs text-muted text-center mb-2 uppercase tracking-widest">Name the highlighted country</p>
        <div className="flex flex-col gap-1.5 max-w-lg mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Tab') { e.preventDefault(); handleSkip() }
            }}
            placeholder="Country name…"
            disabled={isInputDisabled}
            autoFocus
            className={`w-full h-11 bg-subtle border rounded-lg px-3 text-sm text-primary placeholder:text-muted focus:outline-none disabled:opacity-50 transition-colors ${inputBorderClass}`}
          />
          {revealName && (
            <p className="text-xs font-semibold text-center" style={{ color: 'var(--error)' }}>{revealName}</p>
          )}
          <div className="flex justify-end gap-4">
            <button onClick={handleSubmit} disabled={isInputDisabled} className="text-accent text-sm font-medium disabled:opacity-50 hover:opacity-80">Submit</button>
            <button onClick={handleSkip} disabled={isInputDisabled} className="text-muted text-sm disabled:opacity-50 hover:text-secondary">Skip</button>
          </div>
        </div>
        {feedback?.result === 'CLOSE' && (
          <div className="mt-2 max-w-lg mx-auto border-l-4 border-warning pl-3 py-2">
            <p className="text-warning font-medium text-sm mb-1">{feedback.hint}</p>
            <div className="flex gap-2">
              <button onClick={handleConfirmClose} className="px-3 py-1 bg-warning text-white rounded text-xs font-medium">Yes!</button>
              <button onClick={handleRetry} className="px-3 py-1 border border-warning text-warning rounded text-xs">Retype</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
