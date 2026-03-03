import * as React from "react";
import { BookOpen, CalendarPlus, GraduationCap, Layers3, Plus, Trash2, BookMarked } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

import {
  useAddTutorAvailability,
  useAddTutorSubject,
  useDeleteTutorAvailability,
  useDeleteTutorSubject,
  useMyTutorAvailability,
  useMyTutorProfile,
  useMyTutorSubjects,
  useUpdateTutorSubject,
  useUpsertMyTutorProfile,
} from "@/hooks/use-tutors";
import { useMyTuteeProfile, useUpsertMyTuteeProfile } from "@/hooks/use-tutees";
import { TutorProfileForm } from "@/components/forms/TutorProfileForm";
import { TuteeProfileForm } from "@/components/forms/TuteeProfileForm";
import { TutorSubjectDialog } from "@/components/forms/TutorSubjectDialog";
import { AvailabilityDialog } from "@/components/forms/AvailabilityDialog";
import type { TutorSubject, TutorAvailability } from "@shared/schema";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function ProfilePage() {
  const { toast } = useToast();

  const tutorProfile = useMyTutorProfile();
  const tuteeProfile = useMyTuteeProfile();

  const upsertTutorProfile = useUpsertMyTutorProfile();
  const upsertTuteeProfile = useUpsertMyTuteeProfile();

  const subjects = useMyTutorSubjects();
  const addSubject = useAddTutorSubject();
  const updateSubject = useUpdateTutorSubject();
  const deleteSubject = useDeleteTutorSubject();

  const availability = useMyTutorAvailability();
  const addAvailability = useAddTutorAvailability();
  const deleteAvailability = useDeleteTutorAvailability();

  const [subjectDialogOpen, setSubjectDialogOpen] = React.useState(false);
  const [subjectDialogMode, setSubjectDialogMode] = React.useState<"create" | "edit">("create");
  const [editingSubject, setEditingSubject] = React.useState<TutorSubject | null>(null);

  const [availabilityDialogOpen, setAvailabilityDialogOpen] = React.useState(false);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmKind, setConfirmKind] = React.useState<"subject" | "availability">("subject");
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  const onDelete = () => {
    if (!pendingDeleteId) return;
    if (confirmKind === "subject") {
      deleteSubject.mutate(pendingDeleteId, {
        onSuccess: () => toast({ title: "Deleted", description: "Subject removed." }),
        onError: (e: any) => toast({ title: "Delete failed", description: String(e.message ?? e), variant: "destructive" as any }),
      });
    } else {
      deleteAvailability.mutate(pendingDeleteId, {
        onSuccess: () => toast({ title: "Deleted", description: "Availability removed." }),
        onError: (e: any) => toast({ title: "Delete failed", description: String(e.message ?? e), variant: "destructive" as any }),
      });
    }
  };

  return (
    <AppShell title="Profile">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300">
                      <GraduationCap className="h-3.5 w-3.5" /> Teacher
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-green-600" />
                    <div className="font-display text-2xl tracking-tight">Teacher Profile</div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    This is what students see when they're looking for a teacher.
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <TutorProfileForm
                  initial={tutorProfile.data ?? null}
                  onSubmit={(values) =>
                    upsertTutorProfile.mutate(values, {
                      onSuccess: () =>
                        toast({ title: "Saved", description: "Tutor profile updated." }),
                      onError: (e: any) =>
                        toast({
                          title: "Save failed",
                          description: String(e.message ?? e),
                          variant: "destructive" as any,
                        }),
                    })
                  }
                  isPending={upsertTutorProfile.isPending}
                />
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" />
                    <div className="font-display text-2xl tracking-tight">Subjects I Teach</div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Add the subjects you can teach and set your hourly rate.
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setSubjectDialogMode("create");
                    setEditingSubject(null);
                    setSubjectDialogOpen(true);
                  }}
                  className="rounded-xl"
                  data-testid="add-subject"
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-2">Add</span>
                </Button>
              </div>

              <div className="mt-5 space-y-3">
                {(subjects.data ?? []).length === 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                    No subjects yet. Add one to appear in search results.
                  </div>
                ) : (
                  (subjects.data ?? []).map((s) => (
                    <div
                      key={s.id}
                      className="
                        group rounded-2xl border border-border/70 bg-muted/10 p-4
                        hover:bg-muted/20 hover:shadow-sm transition-all duration-200
                      "
                      data-testid={`subject-row-${s.id}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{s.subject}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {String(s.proficiency)} • {dollars(s.hourlyRateCents)}
                            {s.description ? ` • ${s.description}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="rounded-xl"
                            onClick={() => {
                              setSubjectDialogMode("edit");
                              setEditingSubject(s);
                              setSubjectDialogOpen(true);
                            }}
                            data-testid={`edit-subject-${s.id}`}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="rounded-xl"
                            onClick={() => {
                              setConfirmKind("subject");
                              setPendingDeleteId(s.id);
                              setConfirmOpen(true);
                            }}
                            data-testid={`delete-subject-${s.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarPlus className="h-5 w-5 text-[hsl(var(--chart-3))]" />
                    <div className="font-display text-2xl tracking-tight">Availability</div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Add weekly windows (day + time) students can reference.
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => setAvailabilityDialogOpen(true)}
                  className="rounded-xl"
                  data-testid="add-availability"
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-2">Add</span>
                </Button>
              </div>

              <div className="mt-5 space-y-3">
                {(availability.data ?? []).length === 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                    No availability yet. Add at least one window.
                  </div>
                ) : (
                  (availability.data ?? [])
                    .slice()
                    .sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0))
                    .map((a: TutorAvailability) => (
                      <div
                        key={a.id}
                        className="
                          group rounded-2xl border border-border/70 bg-muted/10 p-4
                          hover:bg-muted/20 hover:shadow-sm transition-all duration-200
                        "
                        data-testid={`availability-row-${a.id}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium">
                              {dayLabels[a.dayOfWeek ?? 0]} • {a.startTime}–{a.endTime}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Weekly window
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            className="rounded-xl"
                            onClick={() => {
                              setConfirmKind("availability");
                              setPendingDeleteId(a.id);
                              setConfirmOpen(true);
                            }}
                            data-testid={`delete-availability-${a.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <BookMarked className="h-3.5 w-3.5" /> Student
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-blue-600" />
                <div className="font-display text-2xl tracking-tight">Student Profile</div>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                This helps teachers understand what you want to learn.
              </div>

              <div className="mt-5">
                <TuteeProfileForm
                  initial={tuteeProfile.data ?? null}
                  onSubmit={(values) =>
                    upsertTuteeProfile.mutate(values, {
                      onSuccess: () =>
                        toast({ title: "Saved", description: "Tutee profile updated." }),
                      onError: (e: any) =>
                        toast({
                          title: "Save failed",
                          description: String(e.message ?? e),
                          variant: "destructive" as any,
                        }),
                    })
                  }
                  isPending={upsertTuteeProfile.isPending}
                />
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay">
            <div className="p-6">
              <div className="font-display text-xl tracking-tight">Publishing checklist</div>
              <div className="mt-2 grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                  <div className="font-medium flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-green-600" /> 1) Teacher profile</div>
                  <div className="text-muted-foreground">
                    {tutorProfile.data ? "✅ Done" : "Add your university + bio to start teaching"}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                  <div className="font-medium flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-accent" /> 2) Subjects I Teach</div>
                  <div className="text-muted-foreground">
                    {(subjects.data ?? []).length > 0 ? "✅ Done" : "Add at least one subject"}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                  <div className="font-medium flex items-center gap-1.5"><CalendarPlus className="h-4 w-4" /> 3) Availability</div>
                  <div className="text-muted-foreground">
                    {(availability.data ?? []).length > 0 ? "✅ Done" : "Add a weekly window"}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => toast({ title: "Nice.", description: "That’s the week 1 flow. Payments later." })}
                className="mt-4 w-full rounded-xl"
                data-testid="profile-checklist-cta"
              >
                Review my marketplace listing
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <TutorSubjectDialog
        open={subjectDialogOpen}
        onOpenChange={setSubjectDialogOpen}
        mode={subjectDialogMode}
        initial={editingSubject}
        isPending={addSubject.isPending || updateSubject.isPending}
        onCreate={(values) =>
          addSubject.mutate(values, {
            onSuccess: () => {
              toast({ title: "Added", description: "Subject listed." });
              setSubjectDialogOpen(false);
            },
            onError: (e: any) =>
              toast({
                title: "Add failed",
                description: String(e.message ?? e),
                variant: "destructive" as any,
              }),
          })
        }
        onUpdate={(values) => {
          if (!editingSubject) return;
          updateSubject.mutate(
            { subjectId: editingSubject.id, ...values },
            {
              onSuccess: () => {
                toast({ title: "Saved", description: "Subject updated." });
                setSubjectDialogOpen(false);
              },
              onError: (e: any) =>
                toast({
                  title: "Save failed",
                  description: String(e.message ?? e),
                  variant: "destructive" as any,
                }),
            },
          );
        }}
      />

      <AvailabilityDialog
        open={availabilityDialogOpen}
        onOpenChange={setAvailabilityDialogOpen}
        isPending={addAvailability.isPending}
        onSubmit={(values) =>
          addAvailability.mutate(values, {
            onSuccess: () => {
              toast({ title: "Added", description: "Availability window created." });
              setAvailabilityDialogOpen(false);
            },
            onError: (e: any) =>
              toast({
                title: "Add failed",
                description: String(e.message ?? e),
                variant: "destructive" as any,
              }),
          })
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmKind === "subject" ? "Delete subject?" : "Delete availability?"}
        description={
          confirmKind === "subject"
            ? "This removes the subject from your listing. Existing sessions remain."
            : "This removes the weekly window. Students may still request sessions manually."
        }
        confirmLabel="Delete"
        destructive
        isPending={deleteSubject.isPending || deleteAvailability.isPending}
        onConfirm={() => {
          onDelete();
          setConfirmOpen(false);
        }}
        data-testid="confirm-delete"
      />
    </AppShell>
  );
}
