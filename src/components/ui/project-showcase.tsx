"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowUpRight } from "lucide-react"

interface Project {
  title: string
  description: string
  year: string
  link: string
  image: string
}

const projects: Project[] = [
  {
    title: "VisionForge",
    description: "Custom-trained object detection for quality control, inventory tracking, and defect inspection.",
    year: "In Development",
    link: "#",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2670&auto=format&fit=crop",
  },
  {
    title: "NexChat",
    description: "Multilingual AI assistants fine-tuned for your industry \u2014 English, Burmese, and Thai.",
    year: "In Development",
    link: "#",
    image: "https://images.unsplash.com/photo-1676299081847-824916de030a?q=80&w=2670&auto=format&fit=crop",
  },
  {
    title: "DocStream",
    description: "OCR-powered extraction pipeline that turns invoices, receipts, and contracts into structured data.",
    year: "In Development",
    link: "#",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop",
  },
]

export function ProjectShowcase() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor

    let active = true
    const animate = () => {
      if (!active) return
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, 0.12),
        y: lerp(prev.y, mousePosition.y, 0.12),
      }))
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      active = false
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [mousePosition])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index)
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    setIsVisible(false)
  }

  return (
    <section ref={containerRef} onMouseMove={handleMouseMove} className="relative w-full max-w-4xl mx-auto px-5 py-16 md:px-[60px] md:py-24">
      <div className="mb-10 md:mb-14 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[3px] text-[#94fcff]/60 mb-2">
            Portfolio
          </p>
          <h2 className="text-2xl md:text-[40px] font-normal uppercase tracking-[2px] text-[#f0f1ef] font-[family-name:var(--font-display)] leading-tight">
            Selected Work
          </h2>
        </div>
        <p className="max-w-[280px] text-[11px] font-medium uppercase tracking-[1px] text-[#f0f1ef]/40 md:text-right">
          AI products built in-house, deployed for businesses across Southeast Asia.
        </p>
      </div>

      {/* Floating image preview — follows cursor */}
      <div
        className="pointer-events-none absolute z-50 overflow-hidden rounded-xl shadow-2xl hidden md:block"
        style={{
          left: 0,
          top: 0,
          transform: `translate3d(${smoothPosition.x + 20}px, ${smoothPosition.y - 100}px, 0)`,
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.8,
          transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), scale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}
      >
        <div className="relative w-[280px] h-[180px] bg-[#1a2630] rounded-xl overflow-hidden">
          {projects.map((project, index) => (
            <img
              key={project.title}
              src={project.image}
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out"
              style={{
                opacity: hoveredIndex === index ? 1 : 0,
                scale: hoveredIndex === index ? 1 : 1.1,
                filter: hoveredIndex === index ? "none" : "blur(10px)",
              }}
            />
          ))}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1418]/40 to-transparent" />
          {/* Cyan border glow */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-[#94fcff]/20" />
        </div>
      </div>

      {/* Project list */}
      <div className="space-y-0">
        {projects.map((project, index) => (
          <a
            key={project.title}
            href={project.link}
            className="group block cursor-pointer"
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative py-5 border-t border-[#f0f1ef]/10 transition-all duration-300 ease-out">
              {/* Background highlight on hover */}
              <div
                className={`
                  absolute inset-0 -mx-4 px-4 bg-[#1a2630]/60 rounded-lg
                  transition-all duration-300 ease-out
                  ${hoveredIndex === index ? "opacity-100 scale-100" : "opacity-0 scale-95"}
                `}
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2">
                    <h3 className="text-[#f0f1ef] font-medium text-lg tracking-tight font-[family-name:var(--font-display)]">
                      <span className="relative">
                        {project.title}
                        <span
                          className={`
                            absolute left-0 -bottom-0.5 h-px bg-[#94fcff]
                            transition-all duration-300 ease-out
                            ${hoveredIndex === index ? "w-full" : "w-0"}
                          `}
                        />
                      </span>
                    </h3>

                    <ArrowUpRight
                      className={`
                        w-4 h-4 text-[#94fcff]
                        transition-all duration-300 ease-out
                        ${
                          hoveredIndex === index
                            ? "opacity-100 translate-x-0 translate-y-0"
                            : "opacity-0 -translate-x-2 translate-y-2"
                        }
                      `}
                    />
                  </div>

                  <p
                    className={`
                      text-sm mt-1 leading-relaxed
                      transition-all duration-300 ease-out
                      ${hoveredIndex === index ? "text-[#f0f1ef]/70" : "text-[#6e7a84]"}
                    `}
                  >
                    {project.description}
                  </p>
                </div>

                <span
                  className={`
                    text-xs font-mono tabular-nums
                    transition-all duration-300 ease-out
                    ${hoveredIndex === index ? "text-[#94fcff]/60" : "text-[#6e7a84]"}
                  `}
                >
                  {project.year}
                </span>
              </div>
            </div>
          </a>
        ))}

        {/* Bottom border */}
        <div className="border-t border-[#f0f1ef]/10" />
      </div>
    </section>
  )
}
