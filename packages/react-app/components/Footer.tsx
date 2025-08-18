import React from "react";

type Props = {
  className?: string;
};

const navigation = [
  {
    name: "Twitter",
    href: "https://twitter.com/CeloDevs",
    icon: (props: Props) => (
      <svg
        fill="currentColor"
        viewBox="0 0 24 24"
        {...props}
        style={{
          width: "1.5rem",
          height: "1.5rem",
          display: "block",
        }}
      >
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
  },
];

export default function Footer() {
  const particles = Array.from({ length: 10 }).map((_, i) => {
    const top = `${Math.random() * 100}%`;
    const left = `${Math.random() * 100}%`;
    const size = `${Math.random() * 10 + 2}px`;
    const glow1 = `rgba(180,100,255,${Math.random() * 0.8 + 0.2})`;
    const glow2 = `rgba(100,200,255,${Math.random() * 0.5})`;
    const bg = `radial-gradient(circle, ${glow1}, ${glow2})`;

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          top,
          left,
          width: size,
          height: size,
          borderRadius: "50%",
          background: bg,
          opacity: 0.6,
          filter: "blur(1px)",
        }}
      />
    );
  });

  const trails = Array.from({ length: 5 }).map((_, i) => {
    const top = `${Math.random() * 20}px`;
    const left = `${Math.random() * 20}px`;
    const w = `${Math.random() * 6 + 2}px`;
    const h = `${Math.random() * 6 + 2}px`;
    const bg = `radial-gradient(circle, rgba(100,200,255,0.8), rgba(180,100,255,0.5))`;

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          top,
          left,
          width: w,
          height: h,
          borderRadius: "50%",
          background: bg,
          opacity: 0.4,
          filter: "blur(2px)",
        }}
      />
    );
  });

  return (
    <>
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          background:
            "linear-gradient(to bottom, transparent, rgba(76,29,149,0.3), rgba(49,46,129,0.6))",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(34,211,238,0.2)",
          padding: "0.4rem 0",
          boxShadow:
            "0 0 30px rgba(100,150,255,0.3), 0 0 60px rgba(180,100,255,0.2), inset 0 0 20px rgba(100,200,255,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            margin: "0 auto",
            maxWidth: "1120px",
            padding: "0.5rem 1rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/*//NT */}
          <div style={{ display: "flex", gap: "1rem", order: 2 }}>
          </div>

          <div
            style={{
              order: 1,
              width: "100%",
              textAlign: "center",
              marginTop: "0.5rem",
              position: "relative",
              zIndex: 31,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "1rem",
                color: "rgba(224,255,255,1)",
                fontFamily: "monospace",
                letterSpacing: "0.05em",
                textShadow:
                  "0 0 8px rgba(100,200,255,0.7), 0 0 16px rgba(180,100,255,0.5)",
              }}
            >
              © {new Date().getFullYear()} Built for Celo Network
            </p>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          {particles}
        </div>
      </footer>

      <a
        href="https://twitter.com/CeloDevs"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          bottom: "2rem",
          left: "2rem",
          zIndex: 40,
          width: "3rem",
          height: "3rem",
          borderRadius: "50%",
          background: "linear-gradient(to bottom right, #1DA1F2, #0d8bf0)",
          boxShadow: "0 0 10px rgba(29,161,242,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          animation: "float",
        }}
      >
        <svg
          fill="white"
          viewBox="0 0 24 24"
          style={{ width: "1.5rem", height: "1.5rem" }}
        >
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      </a>

      <a
        href="https://t.me/+gBQvwvV1AUFkMzU0"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          bottom: "4rem", 
          right: "2rem",
          zIndex: 40,
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "50%",
          background: "linear-gradient(to bottom right, #2dd4bf, #3b82f6)",
          boxShadow: "0 0 10px rgba(0, 211, 255, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          animation: "float",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          style={{ width: "2rem", height: "2rem" }}
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
        </svg>

        <div
          style={{
            position: "absolute",
            top: "-1rem",
            left: "-1rem",
            width: "5rem",
            height: "5rem",
            zIndex: 0,
          }}
        >
          {trails}
        </div>
      </a>
    </>
  );
}
