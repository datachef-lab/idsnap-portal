import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users, CheckSquare, FileCheck, BadgeCheck } from "lucide-react";

interface StatisticsProps {
  stats: {
    total: number;
    checked: number;
    verified: number;
    approved: number;
  };
  loading?: boolean;
}

export function StatCards({ stats, loading = false }: StatisticsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Students",
      value: stats.total,
      icon: <Users className="text-blue-500" />,
      description: "Total registered students",
      color: "border-blue-100",
    },
    {
      title: "Checked In",
      value: stats.checked,
      icon: <CheckSquare className="text-green-500" />,
      description: "Students who logged in",
      color: "border-green-100",
    },
    {
      title: "Verified",
      value: stats.verified,
      icon: <FileCheck className="text-orange-500" />,
      description: "ID uploads pending approval",
      color: "border-orange-100",
    },
    {
      title: "Approved",
      value: stats.approved,
      icon: <BadgeCheck className="text-purple-500" />,
      description: "Students with approved IDs",
      color: "border-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className={`border-l-4 ${card.color}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
