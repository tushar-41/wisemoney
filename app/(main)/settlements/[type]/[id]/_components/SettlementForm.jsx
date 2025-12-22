"use client";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar } from "@radix-ui/react-avatar";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const settlementSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be postive number",
    }),
  note: z.string().optional(),
  paymentType: z.enum(["youPaid", "theyPaid"]),
});

const SettlementForm = ({ onSuccess, entityType, entityData }) => {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const createSettlement = useConvexMutation(api.settlements.createSettlements);

  const [selectedGroupMemberId, setSelectedGroupMemberId] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = useForm({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: "",
      note: "",
      paymentType: "youPaid",
    },
  });

  //Get selected payment
  const paymentType = watch("paymentType");

  //Single user settlment
  const handleUserSettlement = async (data) => {
    const amount = parseFloat(data.amount);

    try {
      const paidByUserId =
        data.paymentType === "youPaid"
          ? currentUser._id
          : entityData?.counterPart?.userId;

      const receivedByUserId =
        data.paymentType === "youPaid"
          ? entityData?.counterPart?.userId
          : currentUser._id;

      await createSettlement.mutate({
        amount,
        note: data.note,
        paidByUserId,
        receivedByUserId,
        // No groupId for user settlements
      });

      toast.success("Settlement created successfully");
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to record settlement" + error.message);
    }
  };

  const handleGroupSettlement = async (data, selectedGroupMemberId) => {
    if (!selectedGroupMemberId) {
      toast.error("Please select a group member to settle with");
      return;
    }

    const amount = parseFloat(data.amount);
    try {
      // Determine payer and receiver based on the selected payment type and balances
      const paidByUserId =
        data.paymentType === "youPaid"
          ? currentUser._id
          : selectedGroupMemberId;

      const receivedByUserId =
        data.paymentType === "youPaid"
          ? selectedGroupMemberId
          : currentUser._id;

      await createSettlement.mutate({
        amount,
        note: data.note,
        paidByUserId,
        receivedByUserId,
        groupId: entityData.group.id,
      });

      toast.success("Settlement recorded successfully!");
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to record settlement: " + error.message);
    }
  };

  const onSubmit = async (data) => {
    if (entityType === "user") {
      await handleUserSettlement(data);
    } else if (entityType === "group" && selectedGroupMemberId) {
      await handleGroupSettlement(data, selectedGroupMemberId);
    }
  };

  if (!currentUser) return null;

  if (entityType === "user") {
    const otherUser = entityData.counterPart;
    const netBalance = entityData?.counterPart?.netBalance ?? 0;

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Current Balance</h3>
          {netBalance === 0 ? (
            <p className="text-sm text-muted-foreground">
              {" "}
              you all settled up with{otherUser.name}
            </p>
          ) : netBalance > 0 ? (
            <div className="flex justify-between items-center">
              <p>
                <span className="font-medium">{otherUser.name}</span>owes you
              </p>
              <span className="text-xl font-bold text-green-600">
                ₹{netBalance.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <p>
                You owe
                <span className="font-medium ml-4">{otherUser.name}</span>
              </p>
              <span className="text-red-600 font-bold text-xl">
                ₹{Math.abs(netBalance).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Payment directions */}
        <div className="space-y-2">
          <Label>Who paid?</Label>
          <RadioGroup
            defaultValue="youPaid"
            {...register("paymentType")}
            className="flex flex-col space-y-2"
            onValueChange={(value) => {
              // This manual approach is needed because RadioGroup doesn't work directly with react-hook-form
              register("paymentType").onChange({
                target: { name: "paymentType", value },
              });
            }}
          >
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="youPaid" id="youPaid" />
              <Label htmlFor="youPaid" className="flex-grow cursor-pointer">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={currentUser.imageUrl} />
                    <AvatarFallback>
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>You paid {otherUser.name}</span>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="theyPaid" id="theyPaid" />
              <Label htmlFor="theyPaid" className="flex-grow cursor-pointer">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={otherUser.imageUrl} />
                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{otherUser.name} paid you</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1.5">₹</span>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0.01"
              className="pl-7"
              {...register("amount")}
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            placeholder="Dinner, rent, etc."
            {...register("note")}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || netBalance <= 0}
        >
          {isSubmitting ? "Recording..." : "Record settlement"}
        </Button>
      </form>
    );
  }

  // Render form for group settlement
  if (entityType === "group") {
    const groupMembers = entityData.balances;

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Select group member */}
        <div className="space-y-2">
          <Label>Who are you settling with?</Label>
          <div className="space-y-2">
            {groupMembers.map((member) => {
              const isSelected = selectedGroupMemberId === member.userId;
              const isOwing = member.netBalance < 0; // negative means they owe you
              const isOwed = member.netBalance > 0; // positive means you owe them

              return (
                <div
                  key={member.userId}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedGroupMemberId(member.userId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.imageUrl} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <div
                      className={`font-medium ${
                        isOwing
                          ? "text-green-600"
                          : isOwed
                            ? "text-red-600"
                            : ""
                      }`}
                    >
                      {isOwing
                        ? `They owe you ₹${Math.abs(member.netBalance).toFixed(2)}`
                        : isOwed
                          ? `You owe ₹${Math.abs(member.netBalance).toFixed(2)}`
                          : "Settled up"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {!selectedGroupMemberId && (
            <p className="text-sm text-amber-600">
              Please select a member to settle with
            </p>
          )}
        </div>

        {selectedGroupMemberId && (
          <>
            {/* Payment direction */}
            <div className="space-y-2">
              <Label>Who paid?</Label>
              <RadioGroup
                defaultValue="youPaid"
                {...register("paymentType")}
                className="flex flex-col space-y-2"
                onValueChange={(value) => {
                  register("paymentType").onChange({
                    target: { name: "paymentType", value },
                  });
                }}
              >
                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="youPaid" id="youPaid" />
                  <Label htmlFor="youPaid" className="flex-grow cursor-pointer">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={currentUser.imageUrl} />
                        <AvatarFallback>
                          {currentUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        You paid{" "}
                        {
                          groupMembers.find(
                            (m) => m.userId === selectedGroupMemberId
                          )?.name
                        }
                      </span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="theyPaid" id="theyPaid" />
                  <Label
                    htmlFor="theyPaid"
                    className="flex-grow cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage
                          src={
                            groupMembers.find(
                              (m) => m.userId === selectedGroupMemberId
                            )?.imageUrl
                          }
                        />
                        <AvatarFallback>
                          {groupMembers
                            .find((m) => m.userId === selectedGroupMemberId)
                            ?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {
                          groupMembers.find(
                            (m) => m.userId === selectedGroupMemberId
                          )?.name
                        }{" "}
                        paid you
                      </span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1.5">₹</span>
                <Input
                  id="amount"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="pl-7"
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Dinner, rent, etc."
                {...register("note")}
              />
            </div>
          </>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !selectedGroupMemberId}
        >
          {isSubmitting ? "Recording..." : "Record settlement"}
        </Button>
      </form>
    );
  }
};

export default SettlementForm;
