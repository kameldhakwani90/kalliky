'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

export function NavigationWhite() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const businessTypes = [
    { name: 'Restaurants', href: '/food', emoji: '🍕' },
    { name: 'Salons de beauté', href: '/beaute', emoji: '💄' },
    { name: 'Location de véhicules', href: '/location', emoji: '🚗' },
    { name: 'Immobilier', href: '/realstate', emoji: '🏠' }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OS</span>
            </div>
            <span className="text-xl font-bold text-gray-900">OrderSpot.pro</span>
          </Link>

          {/* Menu desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors"
              >
                Métiers
                <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  {businessTypes.map((type) => (
                    <Link
                      key={type.href}
                      href={type.href}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className="text-xl">{type.emoji}</span>
                      <span>{type.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/plans" className="text-gray-700 hover:text-blue-600 transition-colors">
              Tarifs
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-blue-600 transition-colors">
              Blog
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              Contact
            </Link>
          </div>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector />
            <Link href="/login" className="text-gray-700 hover:text-blue-600 transition-colors">
              Connexion
            </Link>
            <Link href="/plans">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Voir nos Plans
              </button>
            </Link>
          </div>

          {/* Menu mobile button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Menu mobile */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <div>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 text-gray-700 hover:text-blue-600"
                >
                  Métiers
                  <ChevronDown className={`h-4 w-4 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="ml-4 mt-2 space-y-2">
                    {businessTypes.map((type) => (
                      <Link
                        key={type.href}
                        href={type.href}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                        onClick={() => {
                          setIsOpen(false);
                          setDropdownOpen(false);
                        }}
                      >
                        <span>{type.emoji}</span>
                        <span>{type.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link href="/plans" className="text-gray-700 hover:text-blue-600" onClick={() => setIsOpen(false)}>
                Tarifs
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-blue-600" onClick={() => setIsOpen(false)}>
                Blog
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600" onClick={() => setIsOpen(false)}>
                Contact
              </Link>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col space-y-3">
                  <Link href="/login" className="text-gray-700 hover:text-blue-600" onClick={() => setIsOpen(false)}>
                    Connexion
                  </Link>
                  <Link href="/plans">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Voir nos Plans
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}