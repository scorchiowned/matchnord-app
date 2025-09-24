"use client";

import { useTranslations } from "next-intl";
import {
  Smartphone,
  Wifi,
  Globe,
  BarChart3,
  Clock,
  Users,
  Trophy,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description:
      "Optimized for mobile devices with touch-friendly interface and fast loading times.",
  },
  {
    icon: Wifi,
    title: "Real-Time Updates",
    description:
      "Live score updates and match events as they happen, powered by real-time technology.",
  },
  {
    icon: Globe,
    title: "Multi-Language",
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
    icon: Clock,
    title: "Match Schedules",
    description:
      "Complete tournament schedules with venue information and match details.",
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
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Optimized performance with instant loading and smooth user experience.",
  },
];

export default function FeaturesSection() {
  const t = useTranslations();

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {" "}
              Follow Tournaments
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform provides all the tools and information you need to stay
            connected with your favorite tournaments and teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

