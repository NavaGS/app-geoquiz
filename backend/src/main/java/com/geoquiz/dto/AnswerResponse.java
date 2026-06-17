package com.geoquiz.dto;

public class AnswerResponse {

    public enum Result { CORRECT, CLOSE, WRONG }

    private Result result;
    private String canonicalName;
    private String hint;
    private double similarityScore;

    public static AnswerResponse correct(String canonicalName) {
        AnswerResponse r = new AnswerResponse();
        r.result = Result.CORRECT;
        r.canonicalName = canonicalName;
        r.similarityScore = 1.0;
        return r;
    }

    public static AnswerResponse close(String canonicalName, double score) {
        AnswerResponse r = new AnswerResponse();
        r.result = Result.CLOSE;
        r.canonicalName = canonicalName;
        r.hint = "Did you mean: " + canonicalName + "?";
        r.similarityScore = score;
        return r;
    }

    public static AnswerResponse wrong(double score) {
        AnswerResponse r = new AnswerResponse();
        r.result = Result.WRONG;
        r.similarityScore = score;
        return r;
    }

    public Result getResult() { return result; }
    public String getCanonicalName() { return canonicalName; }
    public String getHint() { return hint; }
    public double getSimilarityScore() { return similarityScore; }
}
