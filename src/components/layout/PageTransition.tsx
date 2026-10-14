"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  children: React.ReactNode;
}

const variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};

export function PageTransition({ children }: Props) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.16, ease: "easeOut" }}
        // Pages set their own max-w-*; centre that column in the content area.
        className="flex-1 flex flex-col min-h-0 [&>*]:mx-auto [&>*]:w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
