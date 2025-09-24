import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Globe, Zap, Smartphone, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description:
      "Optimized for mobile devices with touch-friendly interface and fast loading times.",
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    description:
      "Live score updates and match events as they happen, powered by real-time technology.",
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description:
      "Available in Finnish, English, Swedish, Norwegian, and Danish for Nordic users.",
  },
  {
    icon: BarChart3,
    title: "Live Standings",
    description:
      "Real-time tournament standings and group tables that update automatically.",
  },
  {
    icon: Users,
    title: "Team Information",
    description:
      "Comprehensive team profiles with player statistics and match history.",
  },
  {
    icon: Trophy,
    title: "Tournament Directory",
    description:
      "Discover and follow tournaments across different sports and age groups.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            About
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {" "}
              MatchNord
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The ultimate platform for following tournaments across the Nordic
            region. We're passionate about bringing you real-time tournament
            information, live scores, and comprehensive match data.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-600 leading-relaxed">
                MatchNord was created to solve a simple problem: making
                tournament information accessible and engaging for everyone.
                Whether you're a player, coach, parent, or fan, we believe you
                should have easy access to real-time tournament data, live
                scores, and comprehensive match information.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mt-4">
                Our platform serves the Nordic region, providing multi-language
                support and mobile-first design to ensure the best possible
                experience for users across Finland, Sweden, Norway, Denmark,
                and beyond.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                Our Impact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    500+
                  </div>
                  <div className="text-gray-600">Active Tournaments</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    10K+
                  </div>
                  <div className="text-gray-600">Live Matches</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    50K+
                  </div>
                  <div className="text-gray-600">Active Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Get in Touch
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Have questions or feedback? We'd love to hear from you!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:info@matchnord.com"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact Us
                </a>
                <a
                  href="/fi/tournaments"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Explore Tournaments
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
