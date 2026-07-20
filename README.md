# Biased Coin Betting Simulator

A dependency-free static website inspired by Victor Haghani and Richard Dewey's biased coin experiment.

## Run locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 5173
```

Then visit `http://localhost:5173`.

## Deploy for free

This project is plain static HTML/CSS/JS, so it can run on Vercel's free Hobby plan.

1. Create a GitHub repository.
2. Push this folder to GitHub.
3. In Vercel, import the repository.
4. Use the default static settings. No build command is required.

The highscore table uses `localStorage`, so scores are saved per browser and do not require a paid database.

## Source

- Essay: https://elmwealth.com/lessons-from-betting-on-a-biased-coin-cool-heads-and-cautionary-tales/
- SSRN paper: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2856963
