# 陈祉辰｜个人网站 V2

`portfolio-v2` 分支保存当前新版；`main` 保留此前上传的版本。当前站点包括个人首页、两个产品案例、教程、文字与思考，以及摄影、Skill 和 AIGC 展示。

## 本地运行

建议使用 Node.js 20 或更新的 LTS 版本。首次下载后执行：

```sh
npm ci --legacy-peer-deps
npm run preview:build
npm run preview
```

访问 `http://localhost:3003`。开发模式使用 `npm run dev`，默认端口为 3000。`node_modules`、`.next*`、本地环境变量及临时素材均不在仓库中。

猫的对话需要自行配置服务端 DeepSeek 密钥；未配置时不调用模型，详见 [CAT-CHAT-SETUP.md](CAT-CHAT-SETUP.md)。摄影原片与正式 Skill 文件待整理，当前仅保留相应方向介绍。

本项目从 Giats 的开源作品集演进而来，保留原始许可和署名。下方为上游项目说明，其中作者介绍及奖项属于原作者，不是本站作者的个人经历。

---

![giats.me cover](/public/og.png)

# giats.me — Personal Portfolio Website

This is the **original source code** for [giats.me](https://giats.me), the personal portfolio website of **Evangelos Giatsidis**.

I designed and built this project from scratch using modern web technologies to push the creative limits of front-end development. The site blends smooth animation, layered visuals, and technical precision to present my work in a unique and immersive way.

> 🏆 **Multi-award-winning site, featured on major design platforms**:
>
> - 🥇 [CSS Design Awards — WOTD + 3 Special Kudos](https://www.cssdesignawards.com/sites/giats-portfolio/46067/)
> - 🥈 [Awwwards — Honorable Mention](https://www.awwwards.com/sites/https-giats-me)
> - 🥉 [GSAP — Site of the Day](https://gsap.com/showcase/?page=1)

---

## ⭐ Show Some Love

If you find this project useful, inspiring, or just cool, please consider giving it a star on GitHub!  
Your support helps me keep improving and sharing my work. Thank you! 🙏

---

## 🧠 Concept & Structure

The visual foundation of giats.me is built around a **three-phase layering system**:

1. **The Background Phase**  
   A dynamic, animated 3D world rendered with React Three Fiber, serving as the visual foundation of the site.

2. **The Main Website Phase**  
   This layer contains all the actual content — projects, about section, contact, etc. Structurally clean and minimal to let animations breathe.

3. **The Fluid Animation Layer (Above All)**  
   A real-time fluid simulation overlays the entire interface, using `mix-blend-mode` and the cursor to create an interactive, artistic brush effect. It responds to user input, adding a subtle but powerful sense of depth and responsiveness.

### 🪟 “Window” Effect

Throughout the content layer, I created intentional **cut-out sections** or “windows” that act as **holes in the layout**, letting the background animation show through. These openings create a surreal experience where the layers visually bleed into each other, amplifying the immersive feel of the site.

---

## ⚙️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **3D & Canvas:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **Animation:** [GSAP](https://greensock.com/gsap/) with ScrollTrigger
- **Transitions & Scroll UX:** Custom GSAP-powered page transitions and smooth scroll behavior
- **Styling:** SCSS / CSS Modules
- **Hosting:** [Vercel](https://vercel.com)

---

## 📸 Assets & Privacy Notice

- Personal and client-related visuals (e.g., images, logos, portraits) have been **blurred, replaced, or omitted** to respect privacy and copyright.
- The full visual experience is available at [giats.me](https://giats.me).
- **Do not reuse images or branding without permission.**

---

## 📄 License & Attribution

This project is licensed under the **MIT License (with attribution required)**.

> If you use this code or parts of it, **credit is required**:
>
> _"Original portfolio design and development by Evangelos Giatsidis — [giats.me](https://giats.me)"_

You are welcome to learn from or build upon this project, but **do not claim it as your own or use it commercially without permission.**

---

## 📬 Contact

- 📧 Email: [vaggelisgiats@gmail.com](mailto:vaggelisgiats@gmail.com)
- 💼 LinkedIn: [linkedin.com/in/giats](https://www.linkedin.com/in/giats/)
- 🌐 Website: [giats.me](https://giats.me)
- 🐦 X (Twitter): [@Giats\_](https://x.com/Giats_)

---

Thank you for checking out my portfolio. I hope this project inspires or helps you in your own creative journey.
