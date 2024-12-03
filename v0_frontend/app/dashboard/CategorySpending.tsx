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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface StatData {
  label: string;
  value: string;
}

export default function CategoryBreakdown() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [stats, setStats] = useState<StatData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await ApiService.get("/api/dashboard/categoryStats");
        console.log("category expenses", response);
        
        if (response && response.categories) {
          setCategories(response.categories);
          setStats(response.stats || []);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error",
          description: "Failed to load category data. Please try again.",
          variant: "destructive",
        });
        setCategories([]);
        setStats([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [toast]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 h-64 w-124 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t w-full">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardFooter>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-124 p-4 flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              No spending data available for this period.
              <br />
              <span className="text-sm">Add some transactions to see your spending patterns.</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 h-64 w-124 p-4 overflow-auto">
          {/* Category Table */}
          <div className="grid grid-cols-12 text-sm text-muted-foreground mb-2 sticky top-0 bg-background z-10 py-2">
            <div className="col-span-6">CATEGORY</div>
            <div className="col-span-3 text-right">% OF TOTAL</div>
            <div className="col-span-3 text-right">AMOUNT</div>
          </div>
          {categories.map((category) => (
            <div
              key={category.name}
              className="grid grid-cols-12 items-center gap-2 hover:bg-muted/50 rounded-lg transition-colors"
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
        </div>
      </CardContent>
      {stats.length > 0 && (
        <CardFooter>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t w-full">
            {stats.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-medium">{stat.value}</p>
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
