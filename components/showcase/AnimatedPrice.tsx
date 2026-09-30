"use client";

import { useEffect, useState } from "react";
import { useReducedMotion, useSpring } from "framer-motion";
import { formatBRL } from "./data";

export default function AnimatedPrice({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const reduce = useReducedMotion() === true;
  const spring = useSpring(value, { stiffness: 70, damping: 20, mass: 0.7 });
  const [text, setText] = useState(() => formatBRL(value));

  useEffect(() => {
    if (reduce) {
      spring.jump(value);
      setText(formatBRL(value));
      return;
    }
    spring.set(value);
  }, [reduce, spring, value]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      setText(formatBRL(latest));
    });
  }, [spring]);

  return <span className={className}>{text}</span>;
}
