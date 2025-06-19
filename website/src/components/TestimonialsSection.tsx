
const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Level0 just saved me weeks of prototyping. I described my roguelike idea and had a playable demo in under 30 seconds. This is the future.",
      author: "Alex Chen",
      handle: "@alexbuilds",
      title: "Indie Developer"
    },
    {
      quote: "As someone with zero coding experience, I never thought I'd see my game ideas come to life. Level0 makes the impossible possible.",
      author: "Sarah Martinez",
      handle: "@sarahgamedev",
      title: "Game Designer"
    },
    {
      quote: "The AI understands game feel better than some humans. The physics and gameplay it generates are surprisingly sophisticated.",
      author: "Marcus Thompson",
      handle: "@pixelarcade",
      title: "Veteran Game Dev"
    },
    {
      quote: "My 8-year-old daughter used Level0 to make a game about unicorns. She's now convinced she's a game developer. 10/10 would recommend.",
      author: "Jennifer Liu",
      handle: "@jenliu_codes",
      title: "Software Engineer"
    },
    {
      quote: "Tried describing a 'Flappy Bird but with rockets in space' and got exactly what I imagined, plus features I didn't even think of.",
      author: "David Park",
      handle: "@gamedev_dave",
      title: "Creative Technologist"
    },
    {
      quote: "This tool is going to democratize game development. The barrier to entry just disappeared completely.",
      author: "Maya Patel",
      handle: "@maya_makes",
      title: "Startup Founder"
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-blue-900/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Loved by{" "}
            <span className="text-gradient">creators</span>
            {" "}everywhere
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of developers, designers, and dreamers building the future of games
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="gradient-border h-full">
                <div className="gradient-border-inner p-6 h-full flex flex-col">
                  <div className="flex-grow">
                    <p className="text-foreground leading-relaxed mb-4 italic">
                      "{testimonial.quote}"
                    </p>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-green rounded-full flex items-center justify-center text-black font-bold text-sm mr-3">
                        {testimonial.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{testimonial.author}</p>
                        <p className="text-sm text-neon-cyan">{testimonial.handle}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
