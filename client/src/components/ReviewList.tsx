import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewItemProps {
    review: {
        id: string;
        rating: number;
        review: string | null;
        tags: string[];
        createdAt: string;
    };
    reviewer: {
        firstName: string | null;
        lastName: string | null;
        profileImageUrl: string | null;
    };
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                />
            ))}
        </div>
    );
}

export function ReviewList({
    reviews,
    averageRating,
    totalReviews,
}: {
    reviews: ReviewItemProps[];
    averageRating: number | null;
    totalReviews: number;
}) {
    if (totalReviews === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No reviews yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-3 pb-3 border-b">
                <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(averageRating ?? 0)} />
                    <span className="text-lg font-semibold">
                        {averageRating?.toFixed(1) ?? "—"}
                    </span>
                </div>
                <span className="text-sm text-muted-foreground">
                    {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-4">
                {reviews.map(({ review, reviewer }) => (
                    <div key={review.id} className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={reviewer.profileImageUrl ?? undefined} />
                                <AvatarFallback className="text-xs">
                                    {(reviewer.firstName?.[0] ?? "") +
                                        (reviewer.lastName?.[0] ?? "")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                    {reviewer.firstName ?? ""} {reviewer.lastName ?? ""}
                                </p>
                                <div className="flex items-center gap-2">
                                    <StarRating rating={review.rating} />
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {review.tags && review.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 ml-11">
                                {review.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {review.review && (
                            <p className="text-sm text-muted-foreground ml-11">
                                {review.review}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
