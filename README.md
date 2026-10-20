# wyunhao.github.io

Personal site of Yunhao Wang, served by GitHub Pages at <https://wyunhao.github.io>.

It is a single hand-built page. GitHub Pages runs Jekyll on every push, so there is no build step to run yourself.

## Updating content

| What | Where |
| --- | --- |
| Papers | `_data/publications.yml` (newest first; the page groups them by `year`) |
| Research themes and keywords | `_data/research.yml` |
| Bio, background, contact | `index.html` |
| Styles / lattice animation | `assets/css/site.css`, `assets/js/site.js` |
| Profile photo | `images/yunhao.jpg` (720×900) and `images/yunhao-480.jpg` |

To add a paper, copy an entry in `_data/publications.yml` and fill it in:

```yaml
- id: shortname              # anchor: wyunhao.github.io/#pub-shortname
  title: "Paper Title"
  authors: [Coauthor One, Yunhao Wang]
  venue: Full Venue Name (ABBR)
  short: ABBR                # shown on the venue stamp, e.g. "CCS '26"
  year: 2026
  status: to appear          # optional; delete once published
  topics: [fhe, omr]         # keys from _data/research.yml
  tldr: One-sentence summary.
  links:
    paper: https://...
    eprint: https://eprint.iacr.org/...
    code: https://github.com/...
```

When Encore's preprint goes online, add its `eprint:` link and the "preprint coming soon" note disappears.

## Local preview

```sh
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>.
