"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import { useEditorialReveal } from "@/lib/editorial-reveal"

interface Project {
  title: string
  description: string
  year: string
  link: string
  image: string
}

const projects: Project[] = [
  {
    title: "NexHR",
    description: "Hire smarter, grow faster \u2014 an AI-native HR platform for onboarding, performance, and workforce analytics.",
    year: "hr.nexapex.ai",
    link: "https://hr.nexapex.ai",
    image: "/images/projects/hr.png",
  },
  {
    title: "Revenue Intelligence",
    description: "AI hotel revenue optimizer \u2014 forecasts demand, flags pricing risk, and turns booking data into a board-ready story.",
    year: "revenue.nexapex.ai",
    link: "https://revenue.nexapex.ai",
    image: "/images/projects/revenue.png",
  },
  {
    title: "Vision Inspector",
    description: "Custom-trained object detection for quality control, inventory tracking, and defect inspection.",
    year: "vision.nexapex.ai",
    link: "https://vision.nexapex.ai",
    image: "/images/projects/vision.png",
  },
  {
    title: "Nexus AI Tarot",
    description: "A playful side project \u2014 AI-generated tarot readings exploring conversational UX and personality design.",
    year: "nat.nexapex.ai",
    link: "https://nat.nexapex.ai",
    image: "/images/projects/nat.png",
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

  useEditorialReveal(containerRef as React.RefObject<HTMLElement | null>, {
    hasIndex: true,
  })

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
    <section ref={containerRef} onMouseMove={handleMouseMove} className="relative w-full max-w-6xl mx-auto px-5 py-20 md:px-[60px] md:py-32">
      <div className="mb-12 md:mb-20 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="editorial-index text-[11px] font-medium uppercase tracking-[4px] text-[#94fcff]/60 mb-3" aria-hidden="true">
            03 / SELECTED WORK
          </p>
          <h2
            className="editorial-heading font-normal uppercase tracking-[3px] text-[#f0f1ef] font-[family-name:var(--font-display)] leading-[1.05] whitespace-nowrap"
            style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)" }}
          >
            Selected Work
          </h2>
        </div>
        <p className="editorial-body max-w-[320px] text-[12px] font-medium uppercase tracking-[2px] text-[#f0f1ef]/55 leading-[1.7] md:text-right">
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
          // eslint-disable-next-line react-doctor/no-permanent-will-change -- transform updated on every mousemove while showcase is mounted
          willChange: "transform",
        }}
      >
        <div className="relative w-[380px] h-[250px] bg-[#1a2630] rounded-xl overflow-hidden">
          {projects.map((project, index) => (
            <Image
              key={project.title}
              src={project.image}
              alt={project.title}
              fill
              sizes="380px"
              className="object-cover transition-all duration-500 ease-out"
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
            target="_blank"
            rel="noopener noreferrer"
            className="editorial-item group block cursor-pointer"
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative py-7 md:py-10 border-t border-[#f0f1ef]/10 transition-all duration-300 ease-out">
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
                    <h3 className="text-[#f0f1ef] font-normal text-2xl md:text-[2rem] tracking-tight font-[family-name:var(--font-display)] uppercase">
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
                        w-5 h-5 md:w-6 md:h-6 text-[#94fcff]
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
                      text-[14px] md:text-[15px] mt-2 md:mt-3 leading-[1.6] max-w-[640px]
                      transition-all duration-300 ease-out
                      ${hoveredIndex === index ? "text-[#f0f1ef]/70" : "text-[#6e7a84]"}
                    `}
                  >
                    {project.description}
                  </p>
                </div>

                <span
                  className={`
                    text-[10px] md:text-[11px] font-mono tabular-nums uppercase tracking-[2px] whitespace-nowrap pt-2
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
