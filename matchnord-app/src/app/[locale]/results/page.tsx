import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, MapPin } from "lucide-react";

// Mock data - will be replaced with real API data
const recentResults = [
  {
    id: "1",
    tournamentName: "Baltic Tournament",
    location: "Copenhagen, Denmark",
    date: "2025-01-12",
    winner: "Team Alpha",
    runnerUp: "Team Beta",
    score: "3-1",
    status: "finished",
  },
  {
    id: "2",
    tournamentName: "Nordic Winter Cup",
    location: "Oslo, Norway",
    date: "2025-01-08",
    winner: "Team Gamma",
    runnerUp: "Team Delta",
    score: "2-0",
    status: "finished",
  },
  {
    id: "3",
    tournamentName: "Scandinavian Championship",
    location: "Gothenburg, Sweden",
    date: "2025-01-05",
    winner: "Team Epsilon",
    runnerUp: "Team Zeta",
    score: "4-2",
    status: "finished",
  },
];

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Results
          </h1>
          <p className="text-lg text-gray-600">
            Recent tournament results and champions
          </p>
        </div>

        {/* Results List */}
        <div className="space-y-6">
          {recentResults.map((result) => (
            <Card key={result.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {result.tournamentName}
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-800">
                    {result.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {result.location}
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(result.date).toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {result.winner}
                      </div>
                      <div className="text-sm text-gray-600">Winner</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.score}
                      </div>
                      <div className="text-sm text-gray-600">Final Score</div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {result.runnerUp}
                      </div>
                      <div className="text-sm text-gray-600">Runner-up</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {recentResults.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Results Available
            </h3>
            <p className="text-gray-600">
              Check back later for tournament results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
