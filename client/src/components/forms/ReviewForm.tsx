import { useState } from "react";
import { useCreateReview } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const REVIEW_TAGS = [
    "patient",
    "knowledgeable",
    "helpful",
    "clear explanations",
    "well-prepared",
    "punctual",
    "encouraging",
    "great examples",
];

interface ReviewFormProps {
    sessionId: string;
    open: boolean;
    onClose: () => void;
}

export function ReviewForm({ sessionId, open, onClose }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const { toast } = useToast();
    const createReview = useCreateReview();

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
        );
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({ title: "Please select a rating", variant: "destructive" });
            return;
        }
        try {
            await createReview.mutateAsync({
                sessionId,
                rating,
                review: review || undefined,
                tags: selectedTags.length > 0 ? selectedTags : undefined,
            });
            toast({ title: "Review submitted!", description: "Thank you for your feedback." });
            setRating(0);
            setReview("");
            setSelectedTags([]);
            onClose();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message ?? "Failed to submit review",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Leave a Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Star Rating */}
                    <div className="flex items-center gap-1 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="p-1 transition-transform hover:scale-110"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={`w-8 h-8 ${star <= (hoverRating || rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        {rating === 0
                            ? "Select a rating"
                            : rating <= 2
                                ? "We're sorry to hear that"
                                : rating <= 3
                                    ? "It was okay"
                                    : rating <= 4
                                        ? "Good experience!"
                                        : "Excellent!"}
                    </p>

                    {/* Tags */}
                    <div>
                        <p className="text-sm font-medium mb-2">What stood out?</p>
                        <div className="flex flex-wrap gap-2">
                            {REVIEW_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedTags.includes(tag)
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-foreground border-border hover:bg-accent"
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Review Text */}
                    <Textarea
                        placeholder="Tell us about your experience... (optional)"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={3}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={rating === 0 || createReview.isPending}
                    >
                        {createReview.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
