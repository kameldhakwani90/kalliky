'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

export function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  
  // Transform video based on scroll progress
  // 0 = début (plein écran)
  // 0.5 = milieu (taille iPhone ~60%)
  // 1 = fin (très petit et disparaît)
  const scale = useTransform(scrollYProgress, [0, 0.5, 0.8, 1], [1, 0.6, 0.3, 0.2]);
  const y = useTransform(scrollYProgress, [0, 0.8, 1], [0, 0, -200]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.3, 0.5], [0, 24, 40]);
  const opacity = useTransform(scrollYProgress, [0.7, 1], [1, 0]);
  
  // Padding pour centrer comme iPhone au milieu
  const padding = useTransform(scrollYProgress, [0, 0.5], ["0%", "10%"]);

  // Intersection Observer pour lazy loading et autoplay
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Autoplay video when it comes into view
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.play().catch(() => {
                // Si l'autoplay échoue (navigateurs qui l'empêchent), on ignore silencieusement
                console.log('Autoplay prevented by browser');
              });
            }
          }, 500); // Petit délai pour laisser la vidéo se charger
          observer.disconnect();
        }
      },
      { threshold: 0.3 } // Augmenté le threshold pour que la vidéo soit plus visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section ref={sectionRef} className="relative h-[110vh] bg-black">
      {/* Sticky Video Container */}
      <div className="sticky top-20 w-full h-[calc(100vh-5rem)] flex items-center justify-center z-10">
        <motion.div
          style={{ 
            scale,
            y,
            opacity,
            padding,
            transformOrigin: "center center"
          }}
          className="relative w-full h-full"
        >
          <motion.div
            style={{ borderRadius }}
            className="relative w-full h-full overflow-hidden max-w-full"
          >
            {/* Video - Lazy loaded */}
            {isInView ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster="https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=450&fit=crop&q=60"
                muted
                playsInline
                loop
                preload="none"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" type="video/mp4" />
              </video>
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              </div>
            )}

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

            {/* Play/Pause Button - Only show when video is loaded */}
            {isInView && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handlePlayPause}
                className="absolute bottom-12 right-12 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group hover:bg-white/20 transition-all duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}