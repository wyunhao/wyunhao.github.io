# wyunhao.github.io

Personal site of Yunhao Wang, served by GitHub Pages at <https://wyunhao.github.io>.

It is a single hand-built page. GitHub Pages runs Jekyll on every push, so there is no build step to run yourself.

## Updating content

| What | Where |
| --- | --- |
| Papers | `_data/publications.yml` (newest first; the page groups them by `year`) |
| Paper PDFs hosted here | `papers/` |
| Topic filter chips | `_data/research.yml` |
| Academic service | `_data/service.yml` |
| Bio and research overview, background | `index.html` |
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
  edition: 2027              # optional; conference year if it differs from `year`
  status: to appear          # optional; delete once published
  author_order: Authors not in alphabetical order   # optional; adds a dagger
  topics: [fhe, omr]         # keys from _data/research.yml
  tldr: One-sentence summary.
  links:
    pdf: /papers/shortname.pdf   # optional; a PDF committed to papers/
    paper: https://...
    eprint: https://eprint.iacr.org/...
    code: https://github.com/...
```

Encore links to the PDF in `papers/encore.pdf`. When its ePrint version is out, add an `eprint:` link next to it.

## Visitor stats

Set `goatcounter:` in `_config.yml` to your GoatCounter code; the dashboard (private by default) is at `https://CODE.goatcounter.com`.
It counts page views and clicks on paper and profile links (shown as events like `paper/encore/pdf`).
Open `https://wyunhao.github.io/#toggle-goatcounter` once in each of your own browsers so your visits aren't counted.

## Local preview

```sh
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>.
