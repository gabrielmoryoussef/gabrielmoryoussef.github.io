---
title: "Improved Algorithm and Bounds for Successive Projection"
authors: ["J. Jin", "Z. T. Ke", "G. Moryoussef", "J. Tang", "J. Wang"]
year: 2024
date: 2024-05-01
venue: "ICLR 2024"
venueFull: "International Conference on Learning Representations (ICLR)"
status: published
themes: [latent-structure]
featured: true
links:
  arxiv: https://arxiv.org/abs/2403.11013
  pdf: https://openreview.net/pdf?id=GlpawHh80l
  openreview: https://openreview.net/forum?id=GlpawHh80l
  code: https://github.com/gabrielmoryoussef/VertexHunting
bibtex: |
  @inproceedings{jin2024improved,
    title         = {Improved Algorithm and Bounds for Successive Projection},
    author        = {Jin, Jiashun and Ke, Zheng Tracy and Moryoussef, Gabriel and Tang, Jiajun and Wang, Jingming},
    booktitle     = {International Conference on Learning Representations (ICLR)},
    year          = {2024},
    eprint        = {2403.11013},
    archivePrefix = {arXiv},
    url           = {https://openreview.net/forum?id=GlpawHh80l}
  }
aliases: [improved-spa, improved_bound_spa]
---

Given a *K*-vertex simplex in a *d*-dimensional space, suppose we measure *n* points on the simplex with noise (hence, some of the observed points fall outside the simplex). Vertex hunting is the problem of estimating the *K* vertices of the simplex. A popular vertex hunting algorithm is successive projection algorithm (SPA). However, SPA is observed to perform unsatisfactorily under strong noise or outliers. We propose pseudo-point SPA (pp-SPA). It uses a projection step and a denoise step to generate pseudo-points and feed them into SPA for vertex hunting. We derive error bounds for pp-SPA, leveraging on extreme value theory of (possibly) high-dimensional random vectors. The results suggest that pp-SPA has faster rates and better numerical performances than SPA. Our analysis includes an improved non-asymptotic bound for the original SPA, which is of independent interest.
