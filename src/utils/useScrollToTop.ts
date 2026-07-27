'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { routing } from '@/i18n/routing'

/**
 * Global component that intercepts clicks on any <a> or Next.js Link
 * pointing to the current page, and smooth-scrolls to the top.
 *
 * Uses the native CSSOM smooth-scroll so gsap is kept out of the eager
 * first-load bundle (gsap still loads lazily for sections that need it).
 *
 * Place this component once in your layout (e.g., alongside <Header />).
 */
export default function ScrollToTopOnSamePage() {
    const pathname = usePathname()

    useEffect(() => {
        // Strip a leading locale segment (e.g. /en) so /en/about and /about
        // compare equal. mn is unprefixed, so only prefixed locales matter here.
        const stripLocale = (p: string) => {
            const seg = p.split('/')[1]
            return routing.locales.includes(seg as never) ? (p.slice(seg.length + 1) || '/') : p
        }
        const normalize = (p: string) => stripLocale(p.replace(/\/+$/, '') || '/')

        const handleClick = (e: MouseEvent) => {
            // Walk up to find the closest <a> element
            const anchor = (e.target as HTMLElement).closest('a')
            if (!anchor) return

            const href = anchor.getAttribute('href')
            if (!href) return

            // Skip external links, hash links, mailto, tel, etc.
            if (
                href.startsWith('http://') ||
                href.startsWith('https://') ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:') ||
                href.startsWith('#')
            ) return

            const targetPath = normalize(href.split('?')[0].split('#')[0])
            const currentPath = normalize(pathname)

            if (targetPath === currentPath) {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        }

        document.addEventListener('click', handleClick, true)
        return () => document.removeEventListener('click', handleClick, true)
    }, [pathname])

    return null
}