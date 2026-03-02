<!-- On-site teaser: From a one-shot prototype to a production-ready internal tool for generating branded blog and social visuals. -->
<!-- SEO meta description: A practical build story using coding agents, strict visual constraints and rapid browser iteration to create consistent procedural assets. -->

# Facet: a procedural brand image system built with agentic engineering

How coding agents helped turn the [Measured visual system](https://measured.co/blog/new-visual-identity) into a procedural image tool, without lowering output quality or UI standards.

Try [Facet](https://facet.msrd.dev).

## First some context

This post relies heavily on two core concepts:

- Agentic engineering
- Flexible visual systems

So let’s define those.

### Agentic engineering

I’ll leave this to [Simon Willison](https://simonwillison.net/), who draws a very useful distinction between _agentic engineering_ and _vibe coding_:

> I think of vibe coding using its [original definition](https://simonwillison.net/2025/Mar/19/vibe-coding/) of coding where you pay no attention to the code at all… Agentic Engineering represents the other end of the scale: professional software engineers using coding agents to improve and accelerate their work by amplifying their existing expertise.
>
> [Writing about agentic engineering patterns](https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/)

At Measured we’ve been using agentic engineering approaches heavily over the past year, in both personal and professional contexts.

### Flexible visual systems

[Flexible Visual Systems](https://www.slanted.de/product/flexible-visual-systems/) by [Martin Lorenz](https://martinlorenz.com/) outlines an approach to visual brand identity that goes beyond the static logo. It’s a method for defining a visual language that can produce many consistent expressions.

The Measured visual brand system was designed using this approach (in collaboration with designer [James Cross](https://www.linkedin.com/in/james-cross-43269317/)).

Key to a flexible system is _shape_ as a core component of the grammar. In the Measured system, that core shape is **The Corner** (plus related derived components).

<!-- IMAGE(S): The Corner, other components -->

## The problem

[Measured blog posts](https://measured.co/blog) use abstract/geometric images (banner, OG, other social) that express the visual system identity and feel recognisably Measured.

We had a small set of compositions from the original identity work to use for these, but we had effectively run out.

<!-- IMAGE: screenshot of blog post using an original composition image -->

## The idea

Build a tool to generate new images for Measured posts and campaigns, using constraints from the Measured visual system.

## The inspiration

The creative direction came from [Processing](https://processing.org/)-style generative art: not AI image generation, but procedural systems.

I’ve always enjoyed this space (for example, the work of [Mark Webster](https://mwebster.online/)).

<!-- IMAGE: one of Mark’s artworks -->

But the blocker was practical, I’d never learned Processing (or similar) properly, and I didn’t have time to start from scratch.

## The question

So could agentic coding workflows bridge that gap?

Despite everyday use of agentic engineering workflows, I’d yet to lean into _vibe coding_ for anything serious. At Measured, we’re accountable for the production code we ship to clients, so we need to stand behind every line, meaning human review.

But this project felt like a good time to give “letting go” a try.

## The experiment

- Let the agent write _all_ the [p5.js](https://p5js.org/) generation code, with no human review (vibed).
- Use agentic assistance plus in-browser review for UI/UX iteration.
- Keep strong constraints from the Measured visual brand system.

## The process

I started by writing a planning doc (with agent assistance) that defined the goal, palette rules, component SVG paths and art-direction constraints.

Then from a one-shot prompt, I immediately got a functioning baseline: canvas, generate action and download action. This was pretty amazing for a few minutes’ work.

<!-- IMAGE: initial screenshot I shared in Slack -->

What followed was iterative: propose a feature, implement it, review it in-browser; accept, tweak or reject it. Describing outcomes in plain language worked really well for this kind of build, as most decisions were visual or behavioural.

Collaboration with the agent (Codex 5.3 in VS Code in this case) was substantive. Beyond defining features, I also asked for tradeoffs between approaches, feature suggestions, code performance reviews, etc. What I got back was generally insightful input that helped inform the directions I chose. Codex is also the perfect [rubber duck](https://en.wikipedia.org/wiki/Rubber_duck_debugging).

I also learnt a lot about p5.js and Processing in the process (pun intended).

## The UI quality bar

As a design engineer, I have a high bar for brand consistency, interaction quality and accessibility. The generated UI was useful early on, but not at a standard we would want to publish as a Measured product. So I did get more hands-on with the UI and UX, requesting specific HTML patterns for accessibility, hand coding some CSS, etc.

The combination that worked:

- Rapid agent iteration (design-in-browser speed).
- Human refinement for interaction detail and brand fit.

<!-- IMAGE: screenshot of the finished UI-->

## Results

Here’s some example images created by Facet.

<!-- IMAGE: collage of facet-generated images -->

## Takeaways

For this project, agentic workflows weren’t just about a quick result. They lowered the barrier to building a custom creative tool that would otherwise have been completely blocked by framework/library learning curves. The agent also proved an educational and collaborative creative partner.

But what really made this work for us was applying our own constraints, iteration and judgement.

## What’s next

At Measured we’re super excited by the recent advances in agentic engineering, and a-buzz with ideas on how to apply these new tools in our UI practice.

Next up, we’re exploring systematic approaches to push one-shot, vibe-coded UI much closer to a team’s actual design language and quality standards from the start.

Try [Facet](https://facet.msrd.dev).
