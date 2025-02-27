import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-16 md:py-32 overflow-hidden bg-dot-pattern">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-blue-600/30 opacity-20"></div>
        <div className="relative z-10">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Ace Your PM Interviews
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-[600px] mb-12 leading-relaxed">
            Practice with AI-powered mock interviews and get personalized
            feedback to land your dream Product Manager role.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Link to="/signup">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="px-8 py-6 rounded-lg border-2 hover:bg-gray-50 transition-colors duration-200"
            >
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container py-16 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start space-x-4 p-6 rounded-lg border bg-card"
            >
              <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const benefits = [
  {
    title: "AI-Powered Practice",
    description:
      "Get realistic interview experience with our advanced AI interviewer that adapts to your responses.",
  },
  {
    title: "Instant Feedback",
    description:
      "Receive detailed feedback on your answers, communication style, and areas for improvement.",
  },
  {
    title: "Curated Questions",
    description:
      "Practice with real PM interview questions from top tech companies, updated regularly.",
  },
];

export default Home;
