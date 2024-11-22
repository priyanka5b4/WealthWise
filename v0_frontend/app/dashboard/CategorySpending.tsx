import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import ApiService from "../utilities/apiService";

export default function CategoryBreakdown() {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    ApiService.get("/api/dashboard/categoryStats").then((response) => {
      console.log("category expenses", response);
      setCategories(response.categories);
      setStats(response.stats);
    });
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 h-64 w-124 p-4 overflow-auto">
          {/* Category Table */}
          <div className="grid grid-cols-12 text-sm text-muted-foreground mb-2">
            <div className="col-span-6">CATEGORY</div>
            <div className="col-span-3 text-right">% OF TOTAL</div>
            <div className="col-span-3 text-right">AMOUNT</div>
          </div>
          {categories.length > 0 &&
            categories.map((category) => (
              <div
                key={category.name}
                className="grid grid-cols-12 items-center gap-2"
              >
                <div className="col-span-6">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start font-normal ${category.color}`}
                  >
                    {category.name}
                  </Button>
                </div>
                <div className="col-span-3 text-right">
                  {category.percentage}%
                </div>
                <div className="col-span-3 text-right text-red-500">
                  ${Math.abs(category.amount).toFixed(2)}
                </div>
              </div>
            ))}

          {/* Statistics */}
        </div>
      </CardContent>
      <CardFooter>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          {stats &&
            stats.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-medium">{stat.value}</p>
              </div>
            ))}
        </div>
      </CardFooter>
    </Card>
  );
}
