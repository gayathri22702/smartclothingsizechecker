# Smart Clothing Size Checker (Batch No. SC-24)
**Department of AIML, IoT & RAI**  
**Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering & Technology (VNRVJIET)**  
*Vignana Jyothi Nagar, Bachupally, Hyderabad, Telangana, India*

---

### Project Information
- **Course**: Design Thinking / CPDT Project
- **Project Batch**: SC-24
- **Supervisor / Mentor**: Mr. U. Veeresh
- **Student Team**:
  - **N. Gayathri** (25071A6648)
  - **Sneha Sam** (25071A6663)
  - **Swayam Prangya** (25071A6664)
  - **K. Hema Sundhar** (25071A0330)
  - **K. Manideep** (25071A0331)

---

## 🎯 Executive Overview & Problem Addressed

Online clothing shoppers struggle with inconsistent sizing across brands (e.g., a "Medium" in Zara is completely different from a "Medium" in Nike or Levi's). Standard sizing charts force customers to manually interpret complex numbers, leading to sizing anxiety, bracketing (ordering multiple sizes), and high return rates.

**The Smart Clothing Size Checker** solves this with an explainable AI sizing engine:
1. **Zero-Friction Authentication**: Sign in via Google OAuth, Email/Password, or Instant Guest Access.
2. **Game-Style Body Type Creator (Dual Top & Pant Sizing)**: For users who don't know their measurements, an RPG character-creator mannequin visually morphs body proportions with customizable archetypes (Petite XXS to 3XL, plus standard 26"-40" Jeans presets), real-time leg inseam length & thigh fullness adjustments, and interactive HUD lines.
3. **Step 1 Category Focus & 1-Click Jeans Auto-Filler**:
   - Focus view filters for **All Measurements**, **Shirt Sizing**, or **Pant / Jeans Sizing**.
   - 1-Click Jeans Waist Buttons (26" to 40") that immediately auto-fill Waist, Hips, and Inseam.
4. **Dual Garment Sizing Source**:
   - **Product URL Analysis**: Paste any product link or pick 1-click popular presets (detects Tops vs Bottoms automatically).
   - **Live Camera & Tag Scanner**: Enabled camera viewfinder with real-time scanlines and HUD targeting to snap physical tags or upload size charts.
5. **Fit Preference Calibration**: Fitted / Snug, Regular / Standard, or Oversized / Streetwear.
6. **Lazy-Proof Explainable Verdict (Category-Specific Breakdown)**:
   - Giant size recommendation (e.g., **"YOUR SIZE: L"** or **"32"**) with a 98% match confidence score.
   - **Strict Body Area Isolation**: 
     - **Shirts / Tops**: Shoulder, Chest, Waist, and Shirt Length only (hips hidden).
     - **Pants / Bottoms**: Waistband, Hips & Seat, and Inseam / Leg Length only (chest and shoulder hidden).
   - **Interactive Size Switcher**: Allows one-click comparison between sizes to see how fit changes in real time.
7. **Design for Environment**: Directly calculates avoided return shipments, packaging reduction, and saved CO₂ emissions.

---

## 🌟 Mentor Feedback Addressed (Slide 13)

| Mentor Suggestion | Implementation in this Application & Presentation |
|---|---|
| **"Add Animations"** | • **Interactive Animated Slide Deck (`presentation.html`)**: 14 full-screen animated slides with 3D perspective transitions, staggered reveals, radial mind-map branch animations, interactive empathy map, and Thank-You celebration confetti.<br>• **Upgraded PowerPoint File (`smart_clothing_size_checker_animated.pptx`)**: Custom entrance wipes, wheels, push transitions, and staggered timing delays across all 14 slides.<br>• **Web Prototype App**: Screen-stagger entrances, celebratory confetti cannon on recommendation reveal, dynamic progress gauge fill animations, breathing mannequin morphing, and tactile button feedback. |
| **"Change Design and Color"** | Replaced generic cold themes with a high-end warm boutique palette: Terracotta (`#D96B47`), Warm Sand (`#FAF7F2`), Warm Amber (`#E29547`), Sage Green (`#4E8765`), and Crisp Glassmorphism. |

---

## 🚀 How to Run the Presentation & Prototype Locally

The project includes both the **Interactive Animated Presentation Deck** and the **Working Prototype Web Application**.

### Option A: Using the Included Python Server (Recommended)

```bash
cd /Users/gayathri/.gemini/antigravity/scratch/smart-clothing-size-checker
python3 server.py
```

- **Interactive Presentation Deck**: Visit **`http://localhost:8080/presentation.html`**
- **Working Prototype Application**: Visit **`http://localhost:8080`**

### Option B: Direct File Opening
- Double-click **`presentation.html`** to present the animated slide deck directly in Chrome, Safari, or Edge.
- Double-click **`index.html`** to test the web application.
- Open **`smart_clothing_size_checker_animated.pptx`** in Microsoft PowerPoint or Apple Keynote to present natively.

---

## 📂 File Architecture

```text
smart-clothing-size-checker/
├── presentation.html                       # 14-Slide full-screen interactive animated presentation deck
├── smart_clothing_size_checker_animated.pptx # Animated PowerPoint presentation with transitions & effects
├── index.html                              # Working Prototype: 4-stage UI (Auth, Sizing Profile, Product & Camera, Results)
├── styles.css                              # Warm boutique theme, responsive layout, stagger entrances, gauges, aura
├── app.js                                  # Auth manager, SVG mannequin deformation, ease matcher, celebration confetti
├── server.py                               # Lightweight local HTTP server with automatic port detection
├── assets/                                 # VNRVJIET & CPDT logos + official team photograph
└── README.md                               # Academic and technical documentation
```

---

## 🔐 Database Security & Cryptographic Authentication Engine

The application includes an enterprise-grade dual database architecture:

1. **MongoDB Support with Graceful SQLite Auto-Fallback**:
   - Seamlessly connects to MongoDB via `MONGO_URI` (or local MongoDB daemon on port 27017).
   - If MongoDB is not running, it automatically defaults to an embedded zero-dependency SQLite document store (`smart_size_checker.db`) without any manual installation or crashes.
   - Also includes a browser-side WebCrypto SHA-256 fallback if run purely statically.
2. **Cryptographic Password Security**:
   - Passwords are **never stored in plain text**.
   - Hashed using **PBKDF2-HMAC-SHA256** with **100,000 key-derivation iterations** and cryptographically secure random 16-byte salts generated via `secrets.token_hex(16)`.
   - Verified via **constant-time digest comparison** (`hmac.compare_digest`) to completely prevent timing-attack vulnerabilities.
3. **Strict Client & Server-Side Input Validation**:
   - **RFC-compliant Email Validation**: Rejects arbitrary text or missing domains (regex `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`).
   - **Password Strength Policy**: Minimum 6 characters with a real-time visual strength meter displaying weak, medium, and strong ratings.
   - **Signup Verification**: Requires full name (min 2 characters) and matching password confirmation.
   - **Tactile Error UI**: Red border highlights with shake animations, inline validation labels, and contextual status banners.
4. **Persistent Measurement Profiles**:
   - User sizing measurements (`height`, `weight`, `chest`, `waist`, `hips`, `shoulder`, `inseam`) are automatically persisted to the database and restored whenever the user logs back in.

---

## 📊 Sizing Tolerance & Ease Calculations

The matching algorithm balances garment measurements ($G$) against user body measurements ($U$) and desired fit ease ($E$):

$$\text{Ease} = G - U$$

- **Fitted / Snug**: Desired Chest Ease $\approx +1.0\text{ in} \text{ to } +2.0\text{ in}$ ($+2.5 \text{ to } +5 \text{ cm}$)
- **Regular / Standard**: Desired Chest Ease $\approx +2.5\text{ in} \text{ to } +4.0\text{ in}$ ($+6 \text{ to } +10 \text{ cm}$)
- **Oversized / Relaxed**: Desired Chest Ease $\approx +5.0\text{ in} \text{ to } +7.5\text{ in}$ ($+12 \text{ to } +19 \text{ cm}$)

Status badges are awarded based on distance from the chosen ease target:
- 🟢 **Accurate Fit**: Perfect match with expected ease
- 🔵 **Loose Fit**: Comfortable, breezy extra ease (ideal for waist/streetwear)
- 🟠 **Snug Fit**: Tailored, close to body
- 🔴 **Tight Fit Warning**: Ease $< 0.5\text{ in}$ (restricting movement)
