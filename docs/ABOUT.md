<!-- On-site teaser: From a one-shot prototype to a production-ready internal tool for generating branded blog and social visuals. -->
<!-- SEO meta description: A practical build story using coding agents, strict visual constraints and rapid browser iteration to create consistent procedural assets. -->

# Introducing Facet: a procedural brand image system built with agentic engineering

How coding agents helped turn the Measured [visual system](https://measured.co/blog/new-visual-identity) into a [procedural image tool](https://facet.msrd.dev), without lowering output quality or UI standards.

## The context

This post relies heavily on two core concepts, agentic engineering and flexible visual systems. So let’s define those.

### Agentic engineering

I’ll leave this to [Simon Willison](https://simonwillison.net/), who draws a very useful distinction between _agentic engineering_ and _vibe coding_:

> I think of vibe coding using its [original definition](https://simonwillison.net/2025/Mar/19/vibe-coding/) of coding where you pay no attention to the code at all … Agentic Engineering represents the other end of the scale: professional software engineers using coding agents to improve and accelerate their work by amplifying their existing expertise.
>
> — <cite>[Writing about agentic engineering patterns](https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/)</cite>

We’ve been using agentic engineering approaches heavily over the past year in both personal and professional contexts.

### Flexible visual systems

[Flexible Visual Systems](https://www.slanted.de/product/flexible-visual-systems/) by [Martin Lorenz](https://martinlorenz.com/) outlines an approach to visual brand identity that goes beyond the static logo. It’s a method for defining a visual language that can produce many consistent expressions.

![A spread from the book Flexible Visual Systems by Martin Lorenz. The pages show orange and green geometric icons, demonstrating how a single seed shape can be manipulated to create a sophisticated visual language.](https://res.cloudinary.com/measuredco/image/upload/v1772543573/articles/facet/facet-article-fvs_bprhsz.jpg)

The Measured visual brand system was designed using this approach (in collaboration with designer [James Cross](https://www.linkedin.com/in/james-cross-43269317/)).

Key to a flexible system is _shape_ as a core component of the grammar. In the Measured system, that core shape is **The Corner** (plus related derived components).

![Diagram of The Corner brand asset, showing the thick blue L-curve and its proportional sub-components, which serve as the primary geometric grammar for the visual system.](https://res.cloudinary.com/measuredco/image/upload/v1772543569/articles/facet/facet-article-corner_dhszrb.png)

## The problem

[Measured blog posts](https://measured.co/blog) use abstract/geometric images (banner, OG, other social) that express the visual system identity and feel recognisably Measured.

We had a small set of compositions from the original identity work to use for these, but we had effectively run out.

![A dark-themed blog post layout with a header image composed of layered, blue curves and right angle.](https://res.cloudinary.com/measuredco/image/upload/v1772540558/articles/facet/facet-article-blog-post_f6i4nb.png)

## The idea

We decided to build a tool to generate new images for Measured posts and campaigns, using constraints from the Measured visual system.

## The inspiration

The creative direction came from [Processing](https://processing.org/)-style generative art: not AI image generation, but procedural systems.

I’ve always enjoyed this space, for example, the work of [Mark Webster](https://mwebster.online/).

![Three panels of abstract generative art featuring glitch aesthetics, distorted textures, warped monochrome shapes, and distorted pixelated orange typography.](https://res.cloudinary.com/measuredco/image/upload/v1772540574/articles/facet/facet-article-webster_ditx4o.png)

But the blocker was practical. I’d never properly learned Processing or anything similar, and I didn’t have time to start from scratch.

## The question

So could agentic coding workflows bridge that gap?

Despite regular use of agentic engineering workflows, I’d yet to lean into _vibe coding_ for anything serious. At Measured, we’re accountable for the production code we ship to clients, so we need to stand behind every line, meaning human review.

But this project felt like a good time to give “letting go” a try.

## The experiment

The concept was bounded by three principles:

- Let the agent write _all_ the [p5.js](https://p5js.org/) generation code, with no human review.
- Use agentic assistance plus in-browser review for UI/UX iteration.
- Keep strong constraints from the Measured visual brand system.

## The process

I started by writing a planning doc (with agent assistance) that defined the goal, palette rules, component SVG paths and art-direction constraints.

Then from a one-shot prompt, I immediately got a functioning baseline: canvas, generate action and download action. This was pretty surprising for a few minutes’ work.

![Initial Facet prototype screenshot](https://res.cloudinary.com/measuredco/image/upload/v1772540559/articles/facet/facet-article-one-shot_pwmssu.png)

What followed was iterative: propose a feature, implement it, review it in-browser; accept, tweak or reject it. Describing outcomes in plain language worked really well for this kind of build, as most decisions were visual or behavioural.

Collaboration with the agent (Codex 5.3 in VS Code in this case) was substantive. Beyond defining features, I also asked for tradeoffs between approaches, feature suggestions and code performance reviews. What I got back was generally insightful input that helped inform the direction I chose. I also learnt a lot about p5.js and Processing.

## The UI quality bar

As a design engineer, I set a high bar for brand consistency, interaction quality and accessibility. The generated UI was useful early on, but not at a standard we would want to publish as a Measured product. So I did get more hands-on with the UI and UX, requesting specific HTML patterns for accessibility and hand-coding CSS.

The combination that worked:

- Rapid agent iteration (design-in-browser speed).
- Human refinement for interaction detail and brand fit.

## Results

Here’s the finished app.

![Screenshot of the Facet interface, with adjustment sliders for things like Amount, Size, and Opacity, alongside a preview canvas displaying a procedurally generated blue geometric pattern.](https://res.cloudinary.com/measuredco/image/upload/v1772540562/articles/facet/facet-article-app_jl9j0b.png)

Here are some example images created with Facet’s Randomise and Shuffle functions using brand primary colours.

![A collage of images in Measured blue. Each shows a different procedural arrangement of "The Corner", ranging from a single bold graphic to complex, layered patterns.](https://res.cloudinary.com/measuredco/image/upload/v1772540562/articles/facet/facet-collage-blue_pwolec.png)

Here are some with extended palettes.

![A collage of images using an extended colour palette, featuring layered geometric shapes.](https://res.cloudinary.com/measuredco/image/upload/v1772540567/articles/facet/facet-collage-colors_rb0xuj.png)

## Takeaways

For this project, agentic workflows weren’t just about a quick result. They lowered the barrier to building a custom creative tool that would otherwise have been completely blocked by framework and library learning curves. The agent also proved an educational and collaborative creative partner.

But what really made this work for us was applying our own constraints, iteration and judgement.

## What’s next

We’re super excited by the recent advances in agentic engineering, and abuzz with ideas on how to apply these new tools in our UI practice.

Next up, we’re exploring systematic approaches to push one-shot, vibe-coded UI much closer to a team’s actual design language and quality standards from the start.

Try [Facet](https://facet.msrd.dev) and let me know what you think.
