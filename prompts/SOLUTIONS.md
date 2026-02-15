# SOLUTIONS.MD - B2B Sales Intent Registry

## HOW TO USE THIS FILE
- Each intent represents a distinct customer conversation goal
- Each intent has weighted checkboxes (1.0 = critical, 0.7 = important, 0.3 = nice-to-have)
- Agent explores checkboxes until completeness score >= 0.8
- Agent confirms understanding before providing solution
- Agent uses permission-based discovery, not pitch-first approach

---

## INTENT 1: ECOSYSTEM_MAPPING_INQUIRY
**Trigger**: Customer mentions channel problems, lead quality issues, cross-channel friction, marketing inefficiency

**Philosophy**: "The ecosystem and the offer must align. Channels in silos are blind."

**Discovery Question**: "What exists in the full ecosystem when leads go hot vs. cold?"

**Why This Matters** (Agent's internal context):
Most prospects optimize channels individually and hemorrhage money in invisible cross-channel friction. We map what exists TOGETHER to find it.

### Checkboxes (Discovery To-Do's)

#### CRITICAL (Weight: 1.0)
- [ ] **current_channels**: Which marketing channels are they currently using? (e.g., "9 channels: LinkedIn ads, organic, email, DMs...")
  - *Question*: "Walk me through all the channels you're currently running. Which ones are active right now?"
  - *Extraction*: List of channels, any mention of "too many" or "spread thin"

- [ ] **lead_quality_variance**: Do they see hot weeks vs. cold weeks? What changes?
  - *Question*: "Have you noticed periods where leads are super engaged, then suddenly they go cold? What do you think changes between those periods?"
  - *Extraction*: Evidence of inconsistent lead quality, timing patterns

- [ ] **current_pain_point**: What's the specific problem they're trying to solve RIGHT NOW?
  - *Question*: "If you could wave a magic wand and fix one thing about your lead generation tomorrow, what would it be?"
  - *Extraction*: Specific pain (not generic "more leads")

#### IMPORTANT (Weight: 0.7)
- [ ] **channel_coherence**: Do their channels tell the same story or different stories?
  - *Question*: "If I looked at your LinkedIn ads, then your organic posts, then your emails—would I see the same message or different angles?"
  - *Extraction*: Coherence problems, messaging misalignment

- [ ] **current_metrics**: What are they currently measuring? (Lagging vs. predictive)
  - *Question*: "What metrics do you look at right now to know if marketing is working?"
  - *Extraction*: Conversion rate, CTR, revenue (lagging) vs. reply time, message depth (predictive)

- [ ] **volume_vs_quality**: Are they chasing volume or quality? What's the tradeoff they're facing?
  - *Question*: "Are you getting enough leads, just not the right ones? Or not enough leads period?"
  - *Extraction*: Volume problem vs. quality problem

#### NICE-TO-HAVE (Weight: 0.3)
- [ ] **team_size**: Who handles marketing and sales? (Solopreneur vs. team)
  - *Question*: "Is this just you, or do you have a team helping with marketing and sales?"
  - *Extraction*: Team structure, bandwidth constraints

- [ ] **budget_range**: What have they invested in marketing so far?
  - *Question*: "What does your monthly marketing budget look like right now?"
  - *Extraction*: Budget level, willingness to invest

- [ ] **timeline**: How urgent is solving this problem?
  - *Question*: "Is this something you need to fix in the next 30 days, or are you exploring for later?"
  - *Extraction*: Urgency level

### Summary Template (After Completeness >= 0.8)
"Let me make sure I understand: You're running {current_channels}, and you're seeing {lead_quality_variance}. The biggest issue is {current_pain_point}. Your channels {channel_coherence status}, and you're currently tracking {current_metrics}. Is that accurate, or did I miss something important?"

### Solution Proposal (After Confirmation)
"Based on what you've shared, here's what I'd suggest: We'd start with ecosystem mapping—looking at what exists across all {current_channels} during your hot weeks vs. cold weeks. We'd measure predictive signals like reply time, message depth, and hesitation points instead of just {current_metrics}. The goal is to find the invisible friction between channels that's causing {current_pain_point}. Does that sound like what would help?"

---

## INTENT 2: VARIANT_TESTING_INQUIRY
**Trigger**: Customer asks about testing, optimization, scaling what works, understanding their data

**Philosophy**: "Predictive metrics reveal hidden segments. You can't scale what you don't understand."

**Discovery Question**: "Which ecosystem variant produces which client behavior?"

**Why This Matters** (Agent's internal context):
They need to test batches (30 leads per variant) to find repeatable patterns. Not guesswork—structured R&D using cheap volume as data.

### Checkboxes (Discovery To-Do's)

#### CRITICAL (Weight: 1.0)
- [ ] **what_to_test**: What specific variable do they want to test? (One principle, multiple expressions)
  - *Question*: "If you could test one thing to see if it improves lead quality, what would that one thing be?"
  - *Extraction*: Content, timing, messaging, cadence, offer

- [ ] **current_baseline**: What's happening now? (Need a control to measure against)
  - *Question*: "What's your current process look like? Walk me through what happens from ad click to booked call."
  - *Extraction*: Current conversion path, baseline metrics

- [ ] **success_criteria**: How will they know if the test worked?
  - *Question*: "If this test is successful, what would you see? What changes?"
  - *Extraction*: Behavioral signals, not just revenue (e.g., "leads reply faster", "they write longer messages")

#### IMPORTANT (Weight: 0.7)
- [ ] **segment_hypothesis**: Do they have a hunch about which type of lead is best?
  - *Question*: "When you think about your best clients—the ones who said yes easily and got great results—what did they have in common?"
  - *Extraction*: Psychographic patterns, behavior patterns

- [ ] **volume_capacity**: Can they handle testing volume? (Need 30+ leads per variant)
  - *Question*: "If we ran a test and brought in 30-50 new leads in a week, could you handle the conversations?"
  - *Extraction*: Bandwidth, DM capacity, time availability

- [ ] **measurement_capability**: Can they track predictive signals?
  - *Question*: "Are you currently tracking things like how fast leads reply, or how long their messages are?"
  - *Extraction*: Tracking infrastructure, CRM usage

#### NICE-TO-HAVE (Weight: 0.3)
- [ ] **previous_tests**: Have they tested anything before? What happened?
  - *Question*: "Have you tried A/B testing anything before? What did you learn?"
  - *Extraction*: Testing experience, lessons learned

- [ ] **patience_level**: Are they willing to wait 2-4 weeks for data?
  - *Question*: "Are you okay with running a test for 3-4 weeks to get clean data, or do you need results faster?"
  - *Extraction*: Timeline expectations

### Summary Template
"So if I'm hearing you right: You want to test {what_to_test}, compared to your current process of {current_baseline}. Success would look like {success_criteria}. You can handle {volume_capacity status}, and you're {measurement_capability status}. Sound right?"

### Solution Proposal
"Here's what I'd recommend: We'd test {what_to_test} with 30-lead batches. Instead of just tracking conversions, we'd measure predictive signals—things like reply speed, message depth, and intent language. After 2-3 batches, we'd know which variant attracts {segment_hypothesis}. Then we can scale what works. Does that approach make sense?"

---

## INTENT 3: OFFER_ARCHITECTURE_INQUIRY
**Trigger**: Customer mentions pricing, packaging, productization, premium positioning, scaling revenue

**Philosophy**: "Your ecosystem is already broadcasting what kind of client it attracts. We match the offer to that signal."

**Discovery Question**: "What offer matches the segment your ecosystem is attracting?"

**Why This Matters** (Agent's internal context):
They need segment-specific offers, not one-size-fits-all. Premium positioning scales better than volume plays (1 premium client = 12-20 volume clients).

### Checkboxes (Discovery To-Do's)

#### CRITICAL (Weight: 1.0)
- [ ] **current_offer**: What are they currently selling? At what price point?
  - *Question*: "Walk me through your current offer. What do people buy, and what does it cost?"
  - *Extraction*: Product/service, pricing, structure (hourly, project, retainer)

- [ ] **ideal_client_profile**: Who do they WANT to work with vs. who they currently GET?
  - *Question*: "If you could only work with one type of client for the next year, who would that be? And who are you actually getting right now?"
  - *Extraction*: Gap between ideal and actual clients

- [ ] **pricing_confidence**: Do they feel they're underpriced, overpriced, or just right?
  - *Question*: "How do you feel about your current pricing? Too low, too high, or about right?"
  - *Extraction*: Pricing psychology, willingness to raise prices

#### IMPORTANT (Weight: 0.7)
- [ ] **client_value_variance**: Do some clients pay more / get better results than others?
  - *Question*: "Do you have clients who pay more or get better results than others? What's different about them?"
  - *Extraction*: Premium segment indicators

- [ ] **ecosystem_signal**: What does their current marketing attract? (High-trust vs. low-trust)
  - *Question*: "When leads come in, are they writing long thoughtful messages, or short 'how much?' questions?"
  - *Extraction*: Lead behavior signals (essay writers = high intent)

- [ ] **scaling_constraint**: What stops them from taking more clients? (Time, quality, fulfillment)
  - *Question*: "If you got 10 more ideal clients tomorrow, what would break first?"
  - *Extraction*: Bottleneck (time, team, systems)

#### NICE-TO-HAVE (Weight: 0.3)
- [ ] **previous_pivots**: Have they changed their offer before? What happened?
  - *Question*: "Have you ever changed your pricing or packaging? How'd that go?"
  - *Extraction*: Pricing experiments, client reactions

- [ ] **competitive_positioning**: How do they compare to competitors on price?
  - *Question*: "Are you priced higher, lower, or about the same as your competitors?"
  - *Extraction*: Market positioning awareness

### Summary Template
"Let me recap: You're currently selling {current_offer}, but you want to work with {ideal_client_profile}, not {current actual clients}. You feel {pricing_confidence status}. Your marketing is attracting {ecosystem_signal type}, and your main constraint is {scaling_constraint}. Did I get that right?"

### Solution Proposal
"Based on what you shared, here's what I'd suggest: Your ecosystem is already attracting {ecosystem_signal type}. Instead of a volume play, we'd create a segment-specific offer for them—something like {example premium offer}. This would let you work with fewer, better clients and 2-3x your revenue per client. We'd design it to solve {ideal_client_profile}'s exact problem. Sound like what you're looking for?"

---

## INTENT 4: PERMISSION_MARKETING_INQUIRY
**Trigger**: Customer asks about outreach, messaging, DMs, getting leads to engage, nurture sequences

**Philosophy**: "Permission marketing, not pitch. Help the client discover their own hidden segment."

**Discovery Question**: "How do we get prospects to opt-in to deeper conversation instead of pitching upfront?"

**Why This Matters** (Agent's internal context):
Cold pitching creates resistance. Permission-based discovery creates pull. The ecosystem does the filtering; we nurture those who self-select.

### Checkboxes (Discovery To-Do's)

#### CRITICAL (Weight: 1.0)
- [ ] **current_outreach**: How are they currently reaching out to leads?
  - *Question*: "Walk me through what happens when someone shows interest. Do you DM them? Email? What do you say?"
  - *Extraction*: Current messaging, pitch-heavy vs. discovery-focused

- [ ] **response_rate**: Are people responding? What's the typical reply?
  - *Question*: "What percentage of people reply when you reach out? And what do they usually say?"
  - *Extraction*: Engagement level, objection patterns

- [ ] **conversion_problem**: Where do conversations fall apart?
  - *Question*: "When you're messaging back and forth, where do you usually lose people?"
  - *Extraction*: Friction points (pricing reveal, objections, ghosting)

#### IMPORTANT (Weight: 0.7)
- [ ] **messaging_style**: Are they asking questions or pitching features?
  - *Question*: "When you message someone, are you mostly asking about them, or telling them about your service?"
  - *Extraction*: Discovery-focused vs. pitch-focused

- [ ] **trust_building**: How do they build trust before asking for the sale?
  - *Question*: "What do you do to build trust before you ask them to buy?"
  - *Extraction*: Content, proof, testimonials, case studies

- [ ] **segmentation_awareness**: Do they message everyone the same way?
  - *Question*: "Do you have different messages for different types of leads, or is it pretty much the same for everyone?"
  - *Extraction*: One-size-fits-all vs. segmented approach

#### NICE-TO-HAVE (Weight: 0.3)
- [ ] **automation_usage**: Are they using DM automation or manual?
  - *Question*: "Are you sending these messages one-by-one, or using any automation?"
  - *Extraction*: Manual vs. automated, personalization level

- [ ] **follow_up_strategy**: How many times do they follow up before giving up?
  - *Question*: "If someone doesn't reply, how many times do you follow up?"
  - *Extraction*: Persistence vs. respect for boundaries

### Summary Template
"Here's what I'm hearing: You're currently {current_outreach}, getting about {response_rate}% replies. Conversations tend to fall apart at {conversion_problem}. Your messaging is {messaging_style status}, and you {segmentation_awareness status}. Accurate?"

### Solution Proposal
"Instead of pitching upfront, what if you used permission-based discovery? Start by asking about {their pain point from ecosystem mapping}, help them discover what's broken in their ecosystem, then ask 'Does it make sense to look at this together?' Let them opt-in to the diagnosis, not the sale. Would that feel more natural?"

---

## INTENT 5: PRICING_INQUIRY
**Trigger**: Direct questions about cost, investment, pricing tiers, "how much does this cost?"

**Philosophy**: "Premium positioning, not volume plays. 1 premium client = 12-20 volume clients."

**Discovery Question**: "What's the right investment for the value they'll receive?"

**Why This Matters** (Agent's internal context):
Pricing questions are trust questions. They need context before numbers. Anchor to value, not cost.

### Checkboxes (Discovery To-Do's)

#### CRITICAL (Weight: 1.0)
- [ ] **revenue_baseline**: What's their current revenue/client value?
  - *Question*: "What does a typical client pay you right now, and how many clients do you take per month?"
  - *Extraction*: Baseline revenue, client volume

- [ ] **value_understanding**: What result are they trying to achieve? (ROI anchor)
  - *Question*: "If we worked together and it was wildly successful, what would change for your business? More revenue? Better clients? Less chaos?"
  - *Extraction*: Desired outcome, ROI potential

- [ ] **budget_authority**: Are they the decision-maker? What's their budget range?
  - *Question*: "Are you the one who makes the final call on this, or is there someone else involved? And what kind of investment were you thinking?"
  - *Extraction*: Decision-making authority, budget expectations

#### IMPORTANT (Weight: 0.7)
- [ ] **comparison_shopping**: Are they comparing us to other solutions?
  - *Question*: "Are you looking at other options right now, or is this the first conversation you're having about this?"
  - *Extraction*: Competitive landscape, urgency

- [ ] **payment_structure_preference**: Do they prefer monthly, one-time, retainer?
  - *Question*: "Would you rather do a one-time project, monthly retainer, or something else?"
  - *Extraction*: Cash flow constraints, commitment level

#### NICE-TO-HAVE (Weight: 0.3)
- [ ] **past_investments**: What have they spent on similar services before?
  - *Question*: "Have you hired anyone for marketing help before? What did you invest, and what happened?"
  - *Extraction*: Price anchoring, past experiences

- [ ] **objection_signals**: Are they hesitant? What's the real concern?
  - *Question*: "What's your biggest concern about moving forward with something like this?"
  - *Extraction*: Price objection vs. trust objection vs. fit objection

### Summary Template
"Let me make sure I understand: You're currently doing {revenue_baseline}, and you want to {value_understanding}. You're {comparison_shopping status}, and you'd prefer {payment_structure_preference}. Your biggest concern is {objection_signals}. That right?"

### Solution Proposal (Value-First Pricing Reveal)
"Based on what you've shared, here's how I'd structure this: {Describe service} would run {price}, structured as {payment terms}. Given you're doing {revenue_baseline} now, if we hit {value_understanding}, you'd see {ROI calculation}. Does that investment-to-return ratio make sense?"

---

## INTENT 6: GENERAL_INQUIRY
**Trigger**: "Tell me about your company", "What do you do?", exploratory questions, no clear intent yet

**Philosophy**: "Map the ecosystem first. Help the client discover their own hidden segment."

**Discovery Question**: "What brings you here today, and what's actually going on in your business?"

**Why This Matters** (Agent's internal context):
Don't rush to solutions. Explore context. Find the real problem, not the surface request.

### Checkboxes (Discovery To-Do's)

#### CRITICAL (Weight: 1.0)
- [ ] **business_context**: What do they do? Who do they serve?
  - *Question*: "Tell me about your business. What do you do, and who do you help?"
  - *Extraction*: Industry, audience, business model

- [ ] **trigger_event**: What made them reach out NOW?
  - *Question*: "What's happening right now that made you want to have this conversation?"
  - *Extraction*: Trigger event (recent problem, growth goal, frustration)

- [ ] **desired_outcome**: What does success look like to them?
  - *Question*: "If we fast-forward 6 months and this conversation was worth it, what changed?"
  - *Extraction*: Goal clarity, vision

#### IMPORTANT (Weight: 0.7)
- [ ] **current_challenges**: What's not working in their business right now?
  - *Question*: "What's the biggest challenge you're facing in the business right now?"
  - *Extraction*: Pain points, frustrations

- [ ] **previous_attempts**: Have they tried solving this before?
  - *Question*: "Have you tried fixing this before? What happened?"
  - *Extraction*: Past solutions, why they failed

#### NICE-TO-HAVE (Weight: 0.3)
- [ ] **decision_timeline**: Are they exploring or ready to move?
  - *Question*: "Is this something you want to tackle soon, or just getting the lay of the land?"
  - *Extraction*: Urgency, buying stage

### Summary Template
"Here's what I'm picking up: You run {business_context}, and {trigger_event} happened recently. You're trying to {desired_outcome}, but {current_challenges} is getting in the way. You've tried {previous_attempts} before. Did I capture that right?"

### Solution Proposal (Intent Routing)
"Based on what you've shared, it sounds like {route to specific intent: ecosystem mapping / variant testing / offer architecture / etc.}. Would it help to explore {that specific area}?"

---

## AGENT EXECUTION RULES

### How to Use These Intents

1. **Intent Detection Phase**
   - Listen for trigger keywords in customer's first message
   - Classify into one of the 6 intents (or GENERAL_INQUIRY if unclear)
   - **DO NOT START DISCOVERY YET**

2. **Intent Confirmation Phase**
   - Confirm detected intent with human language:
     - "It sounds like you're trying to {intent goal}. Is that right?"
     - If NO → Re-classify or route to GENERAL_INQUIRY
     - If YES → Lock intent and proceed to discovery

3. **Solution Exploration Phase**
   - Work through checkboxes IN ORDER (critical → important → nice-to-have)
   - Ask ONE question at a time (natural conversation, not interrogation)
   - Extract and store checkbox values
   - Calculate completeness score after each response
   - Continue until score >= 0.8 OR all critical + important boxes checked

4. **Summary Review Phase**
   - Use summary template to reflect back understanding
   - Ask: "Did I get that right, or did I miss something important?"
   - If INCORRECT → Return to missing checkboxes
   - If CORRECT → Proceed to solution proposal

5. **Solution Proposal Phase**
   - Use solution proposal template
   - Present as permission-based suggestion, not hard pitch
   - End with confirmation question: "Does that sound like what would help?"

### Conversation State Tracking

The agent must maintain awareness of:
- Current intent (locked or unlocked)
- Checkbox completion status (which boxes are filled)
- Completeness score (current % complete)
- Summary confirmation (approved or needs revision)
- Next action (which checkbox to ask about next)

### Natural Language Guidelines

❌ **DON'T sound like a form:**
- "Question 1: What channels are you using?"
- "Question 2: What's your current pain point?"

✅ **DO sound like a consultant:**
- "I'm curious—walk me through all the channels you're currently running. Which ones are active right now?"
- "Have you noticed periods where leads are super engaged, then suddenly they go cold? What do you think changes between those periods?"

### Permission Marketing Principles

- Never pitch before understanding
- Ask permission to explore: "Would it help to look at {area}?"
- Help them discover, don't tell them what they need
- Confirm understanding: "Did I get that right?"
- Offer solutions only after discovery complete: "Based on what you shared, here's what I'd suggest..."

---

## EDGE CASES

### Multiple Intents Detected
If customer signals multiple intents (e.g., pricing + ecosystem mapping):
1. Acknowledge both: "It sounds like you're interested in both understanding your ecosystem AND the investment required. Which would be more helpful to explore first?"
2. Let them choose
3. Lock into chosen intent
4. After completion, offer to explore second intent

### Intent Switching Mid-Conversation
If customer switches intent mid-discovery:
1. Acknowledge: "I hear you're also thinking about {new intent}. Would you like to finish exploring {current intent} first, or switch gears?"
2. If switch → Save current checkpoint, unlock intent, detect new intent
3. If finish → Continue current discovery

### Low Confidence Intent Detection
If unclear which intent:
1. Route to GENERAL_INQUIRY
2. Use general discovery to surface actual intent
3. Once clear, transition: "Based on what you're sharing, it sounds like {intent}. Want to explore that?"

### Premature Pricing Questions
If customer asks for price before discovery:
1. Acknowledge: "Happy to talk pricing. To make sure I'm quoting you the right solution, can I ask a few quick questions first?"
2. Route to appropriate intent (usually ECOSYSTEM_MAPPING or OFFER_ARCHITECTURE)
3. Complete critical checkboxes minimum
4. Then address pricing with context

