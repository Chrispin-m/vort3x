type Props = {
  className?: string;
};

const navigation = [
  {
    name: "Twitter",
    href: "https://twitter.com/CeloDevs",
    icon: (props: Props) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
  }
];

export default function Footer() {
  return (
    <>
      <footer className="fixed bottom-0 w-full bg-gradient-to-b from-transparent via-purple-900/30 to-indigo-900/60 backdrop-blur-lg border-t border-cyan-300/20 py-4 z-30 cosmic-glow">
        <div className="mx-auto max-w-7xl py-2 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-cyan-200 hover:text-white transition-all duration-300 hover:scale-110"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </a>
            ))}
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-base text-cyan-100 font-mono tracking-wider glow-text">
              &copy; {new Date().getFullYear()} Built for Minipay
            </p>
          </div>
        </div>
        
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full cosmic-particle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 10 + 2}px`,
                height: `${Math.random() * 10 + 2}px`,
                animationDelay: `${Math.random() * 5}s`,
                background: `radial-gradient(circle, 
                  rgba(180, 100, 255, ${Math.random() * 0.8 + 0.2}), 
                  rgba(100, 200, 255, ${Math.random() * 0.5}))`
              }}
            />
          ))}
        </div>
      </footer>
      
      {/* Telegram Icon */}
      <a
        href="https://t.me/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-40 ethereal-float"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50 flex items-center justify-center cosmic-pulse">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="white"
            className="w-8 h-8"
          >
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
          </svg>
        </div>
        
        <div className="absolute -top-4 -left-4 w-20 h-20 z-0">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full particle-trail"
              style={{
                top: `${Math.random() * 20}px`,
                left: `${Math.random() * 20}px`,
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                animationDelay: `${Math.random() * 2}s`,
                background: `radial-gradient(circle, rgba(100, 200, 255, 0.8), rgba(180, 100, 255, 0.5))`
              }}
            />
          ))}
        </div>
      </a>
    </>
  );
}