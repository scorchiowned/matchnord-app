"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Trophy } from "lucide-react";

// Mock data - will be replaced with real API data
const featuredTournaments = [
  {
    id: "1",
    name: "Nordic Youth Championship 2025",
    location: "Helsinki, Finland",
    startDate: "2025-03-15",
    endDate: "2025-03-17",
    teams: 24,
    divisions: 3,
    status: "upcoming",
    image: "/api/placeholder/400/200",
  },
  {
    id: "2",
    name: "Scandinavian Cup",
    location: "Stockholm, Sweden",
    startDate: "2025-02-20",
    endDate: "2025-02-23",
    teams: 16,
    divisions: 2,
    status: "ongoing",
    image: "/api/placeholder/400/200",
  },
  {
    id: "3",
    name: "Baltic Tournament",
    location: "Copenhagen, Denmark",
    startDate: "2025-01-10",
    endDate: "2025-01-12",
    teams: 32,
    divisions: 4,
    status: "finished",
    image: "/api/placeholder/400/200",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "upcoming":
      return "bg-blue-100 text-blue-800";
    case "ongoing":
      return "bg-green-100 text-green-800";
    case "finished":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "ongoing":
      return "Live";
    case "finished":
      return "Finished";
    default:
      return "Unknown";
  }
};

export default function FeaturedTournaments() {
  const t = useTranslations();

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Featured
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {" "}
              Tournaments
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover exciting tournaments happening across the Nordic region
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredTournaments.map((tournament) => (
            <Card
              key={tournament.id}
              className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg"
            >
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 rounded-t-lg flex items-center justify-center">
                  <Trophy className="w-16 h-16 text-blue-600" />
                </div>
                <Badge
                  className={`absolute top-4 right-4 ${getStatusColor(
                    tournament.status
                  )}`}
                >
                  {getStatusText(tournament.status)}
                </Badge>
              </div>

              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {tournament.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {tournament.location}
                </div>

                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                  {new Date(tournament.endDate).toLocaleDateString()}
                </div>

                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  {tournament.teams} teams • {tournament.divisions} divisions
                </div>

                <Link href={`/tournaments/${tournament.id}`}>
                  <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                    View Tournament
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/tournaments">
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-4 h-auto border-2 border-gray-300 hover:border-gray-400"
            >
              View All Tournaments
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
