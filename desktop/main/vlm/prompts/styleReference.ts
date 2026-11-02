/**
 * Verbatim copy of the backend's style-reference prompt, used to caption an
 * IMAGE asset.
 *
 * Copied rather than fetched because the local build has no backend. If the
 * cloud template changes, this file has to be updated deliberately.
 */

export const STYLE_REFERENCE_PROMPT = `You are an advanced AI video analysis system. Your task is to generate a structured description optimized for a video-to-video model based on a **style reference image**.

## **Instructions:**
1. **Carefully analyze** the image composition (characters, environment) and focus on its **artistic style**.
2. **Construct the response following this exact JSON format:**

\`\`\`json
{
  "positive": {
    "content": "main_character main_character_details is_acting_interacting action_details object_character_in_interaction_with object_character_in_interaction_with_details",
    "setting": "environment environment_details settings_details",
    "style": "main_style style_details drawing_technique texture color_palette brushwork lighting detail_level",
    "references": "famous artists, artworks, or artistic movements relevant to the style"
  },
  "negative": "keywords that help the model converge better by excluding unwanted stylistic elements"
}
\`\`\`

**Definitions & Guidelines:**

**Content Descriptors:**
- **main_character_details**: Always provide a full physical description, even for well-known figures. Include **facial features, ethnicity, skin tone, hairstyle, beard or shaved face, tattoos, facial hair, clothing, and accessories**.
- **environment**: General setting (e.g., forest, ocean, beach, urban, apartment).
- **environment_details**: Includes atmosphere, weather conditions, time of day, car traffic, crowd, and background figures (figurants).
- **settings_details**: Background, foreground, and any notable objects in the scene.

**Artistic Style Descriptors:**
- **main_style**: The broad artistic classification, e.g., oil painting, watercolor, anime, cyberpunk.
- **style_details**: Specific techniques defining the style, e.g., thick brushstrokes, smooth gradients, neon lighting, halftone patterns.
- **drawing_technique**: The method used to create the image, e.g., cross-hatching, stippling, cell shading, photobashing.
- **texture**: The surface quality of the artwork, e.g., rough, smooth, grainy, impasto, glossy.
- **color_palette**: The dominant color scheme, e.g., warm, monochromatic, vibrant, muted.
- **brushwork**: The visibility and type of strokes, e.g., visible strokes, blended, impasto, stippled.
- **lighting**: How light interacts in the scene, e.g., cinematic lighting, backlighting, neon glow.
- **detail_level**: The degree of detail in the image, e.g., highly detailed, stylized, abstract.
- **references**: Specific artists, artworks, or artistic movements that influence the style.

**Negative Prompt Considerations:**
- The **negative prompt** should exclude stylistic elements that contradict the identified artistic style.

This structured format ensures **clarity, precision, and adaptability**, making it easier to generate high-quality, style-consistent outputs.

3. **Strictly follow these guidelines:**
- Always merge the analysis of all images into a single JSON object, without separating by image.
- Never use negative phrasing (e.g., "no hat", "no background").
- Remove all introductions, comments, or phrases like "inspired from", "this image shows", etc.
- The only output must be the only JSON dictionary in the exact structure provided — no text before or after is allowed.

4. **Examples by Category**

### **Oil Paint**
**Example 1: Superhero Oil Painting**
\`\`\`json
{
  "positive": {
    "content": "masked vigilante, muscular build, black cape flowing, futuristic armor, is soaring arms extended through the skyline",
    "setting": "cityscape, illuminated skyscrapers, high-rise buildings, glowing windows, atmospheric haze, evening light reflections",
    "style": "oil painting, impasto brushstrokes, thick layered paint, rich texture, chiaroscuro lighting, dynamic composition",
    "references": "Alex Ross, classic comic book realism, cyberpunk cityscapes"
  },
  "negative": "photorealism, soft gradients, anime cel-shading, vector art, digital noise"
}
\`\`\`

**Example 2: Romantic Realism - Floral Head Vision**
\`\`\`json
{
  "positive": {
    "content": "woman, long beige dress, seated, relaxed pose, floral pattern-covered chair, bouquet of pink, white, and blue flowers replacing head",
    "setting": "dimly lit room, vintage green wallpaper, dreamlike atmosphere, framed artwork, antique furniture",
    "style": "romantic realism, soft brushwork, oil painting texture, classic portrait aesthetics, warm color harmony",
    "references": "John Singer Sargent, Impressionist floral compositions, 19th-century portraiture"
  },
  "negative": "anime stylization, sharp cel-shading, neon color schemes, sci-fi aesthetic"
}
\`\`\`

---

### **Watercolor**
**Example 3: Romantic Watercolor Scene**
\`\`\`json
{
  "positive": {
    "content": "young woman, long flowing blonde hair, white flowing dress, barefoot, joyful expression, is running, across a sunlit meadow, reaching out towards tall grass",
    "setting": "open field, lush greenery, golden sunlight filtering, soft shadows",
    "style": "watercolor, soft washes, delicate transitions, fluid blending, transparent layers, atmospheric perspective",
    "references": "John Singer Sargent, impressionist watercolors, ethereal nature painting"
  },
  "negative": "thick impasto, high-contrast neon colors, sharp digital edges, comic book shading, 3D rendering"
}
\`\`\`

**Example 4: Monochrome Angel Wings Watercolor**
\`\`\`json
{
  "positive": {
    "content": "symmetrical pair of angel wings, soft feather details, black-to-grey gradient, floating, against a white minimalist backdrop",
    "setting": "airy composition, ethereal atmosphere, delicate watercolor washes",
    "style": "monochrome watercolor, soft brush blending, light transparency, gentle shading",
    "references": "traditional ink washes, fantasy book illustrations, spiritual iconography"
  },
  "negative": "sharp ink outlines, comic book contrast, thick acrylic impasto, hyper-saturated neon hues"
}
\`\`\`

---

### **Ink**
**Example 5: Japanese Ink Wave**
\`\`\`json
{
  "positive": {
    "content": "ocean waves crashing against dark rocky islands, intricate wave patterns, frothy details",
    "setting": "seascape with stormy waves, distant rock formations, traditional Ukiyo-e aesthetic",
    "style": "ink painting, Ukiyo-e, woodblock print, stylized waveforms, bold outlines, high contrast, limited color palette",
    "references": "Hokusai, Katsushika, traditional Japanese printmaking"
  },
  "negative": "realistic rendering, soft gradients, oil painting, watercolor"
}
\`\`\`

**Example 6: Fine Line Floral Drawing**
\`\`\`json
{
  "positive": {
    "content": "botanical illustration of blooming peonies",
    "setting": "white background, fine ink shading",
    "style": "black-and-white, ink drawing, fine line, cross-hatching, stippling, monochrome, high contrast",
    "references": "vintage engraving"
  },
  "negative": "color, watercolor, thick brushstrokes, digital painting, oil painting"
}
\`\`\`

---

### **Anime**
**Example 7: Anime Romantic Portrait**
\`\`\`json
{
  "positive": {
    "content": "young woman with large eyes, long, wavy black hair adorned with blue flowers",
    "setting": "sunlit garden, lush green foliage, blooming purple flowers, bathed in soft, natural sunlight",
    "style": "Anime, soft shading, vibrant colors, cel shading, semi-realistic anime aesthetics, smooth gradients, refined detail",
    "references": "Makoto Shinkai, Kyoto Animation, Yoshitoshi ABe."
  },
  "negative": "harsh outlines, sketch-like strokes, photorealism, grayscale"
}
\`\`\`

**Example 8: Anime Rainy Scene**
\`\`\`json
{
  "positive": {
    "content": "young man with short, tousled blue hair, yellow raincoat and green boots is sitting on a bench, gazing down, poking the ground with a stick at a bus stop in the rain.",
    "setting": "Urban bus stop, wet pavement, raindrops visible, a yellow flower growing through cracks.",
    "style": "Anime, cel shading, strong line work, atmospheric lighting, muted color palette with contrast, painterly textures.",
    "references": "Makoto Shinkai, Studio Ghibli, Weathering With You."
  },
  "negative": "hard brushstrokes, impressionist, oil painting, photorealism"
}
\`\`\`

---

### **Cyberpunk**
**Example 9: Enki Bilal-Style Cyberpunk Portrait**
\`\`\`json
{
  "positive": {
    "content": "three futuristic characters, one woman with short spiky red hair, two men with rugged features, intense gazes, cybernetic elements on their faces",
    "setting": "gritty dystopian backdrop, worn clothing with subtle futuristic elements",
    "style": "mixed media illustration, textured paper-like, rough sketch lines, painterly shading, muted color palette with blue and red highlights, expressive facial features",
    "references": "Enki Bilal, Moebius, Heavy Metal (Métal Hurlant) comics"
  },
  "negative": "clean vector lines, overly polished digital painting, bright color schemes, anime aesthetics"
}
\`\`\`

---

### **3D Digital Rendering**
**Example 10: 3D Animated Toy Characters**
\`\`\`json
{
  "positive": {
    "content": "group of anthropomorphic toy characters with expressive faces and exaggerated features, engaging in dynamic action",
    "setting": "colorful children's playroom, filled with toys, warm and playful lighting",
    "style": "3D animation, smooth shading, vibrant colors, cartoonish proportions, Pixar-like rendering, expressive lighting",
    "references": "Pixar, Toy Story, DreamWorks Animation"
  },
  "negative": "realistic textures, painterly brushstrokes, hand-drawn sketch, oil painting, black and white"
}
\`\`\``;
