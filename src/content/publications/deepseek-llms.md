---
title: "A Comparison of DeepSeek and Other LLMs"
authors: ["T. Gao", "J. Jin", "Z. T. Ke", "G. Moryoussef"]
year: 2026
date: 2026-01-02
venue: "Am. Statistician"
venueFull: "The American Statistician 80(1), 164–176"
status: published
themes: [llm]
links:
  doi: https://doi.org/10.1080/00031305.2025.2611010
  arxiv: https://arxiv.org/abs/2502.03688
  pdf: https://arxiv.org/pdf/2502.03688
bibtex: |
  @article{gao2026deepseek,
    title   = {A Comparison of {DeepSeek} and Other {LLMs}},
    author  = {Gao, Tianchen and Jin, Jiashun and Ke, Zheng Tracy and Moryoussef, Gabriel},
    journal = {The American Statistician},
    volume  = {80},
    number  = {1},
    pages   = {164--176},
    year    = {2026},
    doi     = {10.1080/00031305.2025.2611010}
  }
---

Recently, DeepSeek has been the focus of attention in and beyond the AI community. An interesting problem is how DeepSeek compares to other large language models (LLMs). There are many tasks an LLM can do, and in this paper, we use the task of "predicting an outcome using a short text" for comparison. We consider two settings, an authorship classification setting and a citation classification setting. In the first one, the goal is to determine whether a short text is written by human or AI. In the second one, the goal is to classify a citation to one of four types using the textual content. For each experiment, we compare DeepSeek with 4 popular LLMs: Claude, Gemini, GPT, and Llama. We find that, in terms of classification accuracy, DeepSeek outperforms Gemini, GPT, and Llama in most cases, but underperforms Claude. We also find that DeepSeek is comparably slower than others but with a low cost to use, while Claude is much more expensive than all the others. Finally, we find that in terms of similarity, the output of DeepSeek is most similar to those of Gemini and Claude (and among all 5 LLMs, Claude and Gemini have the most similar outputs). In this paper, we also present a fully-labeled dataset collected by ourselves, and propose a recipe where we can use the LLMs and a recent data set, MADStat, to generate new data sets. The datasets in our paper can be used as benchmarks for future study on LLMs.
