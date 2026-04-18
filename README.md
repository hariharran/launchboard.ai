# Launchboard AI

Launchboard AI is a next-generation platform for instantly generating, previewing, and deploying beautiful, high-converting websites and landing pages using AI. It transforms startup ideas and target audiences into polished, launch-ready websites with specialized, dynamic branding logic.

## 🚀 Key Features

- **AI Content Generation**: Generates full site structure, copy, features, testimonials, and FAQs based on a short description of your startup idea.
- **Dynamic AI Branding**: Auto-generates sophisticated, high-end color palettes to match your startup's tone and audience. 
- **Premium UI Render**: Replaces generic "blocky" sites with editorial-grade, typography-first designs featuring glassmorphism and animated gradients.
- **Visual Canvas Navigator**: Seamlessly switch between multi-page outputs (Home, Features, Pricing, About) without losing your workspace context.
- **Custom Client Branding**: Easily override AI suggestions by picking specific hex codes with our intuitive visual color picker for custom brand guidelines.
- **One-Click Export & Deploy**: Export the generated HTML bundles or deploy straight to a live URL.

## 💻 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integration**: Custom Language Model Integration via `/api/ai/generate`

## 🛠 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/launchboard-ai.git
cd launchboard-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root of the project and populate it with the appropriate keys. Check `.env.example` (if available) or ensure the following keys are present depending on your external services:
```env
# Example environment variables
OPENAI_API_KEY=your_api_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
# Add any required database or GoDaddy domain lookup keys
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application. The main generator canvas can be found in the dashboard/generator routes.

## 🌐 Deployment (Vercel)

This project is optimized for deployment on Vercel.

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and create a new project.
3. Import your GitHub repository.
4. Add all environment variables from your `.env.local` into the Vercel dashboard.
5. Click **Deploy**.

## 🎨 Design Philosophy

Launchboard AI takes an **"Aesthetics-First"** approach. The generated sites are not placeholders—they are designed to look like they were built by a premium design agency. The platform utilizes HSL CSS variables, complex Tailwind utilities, and strict typography rules (using serif fonts like Fraunces for impact) to ensure every generation looks stunning.
