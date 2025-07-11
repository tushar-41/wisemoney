"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Spline } from "lucide-react";

export function SplitSelector({
  type,
  amount,
  participants,
  paidByUserId,
  onSplitsChange,
}) {
  const { user } = useUser();
  const [splits, setSplits] = useState([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Calculate splits when inputs change
  useEffect(() => {
    if (!amount || amount <= 0 || participants.length === 0) {
      return;
    }

    let newSplits = [];

    if (type === "equal") {
      // Equal splits
      const shareAmount = amount / participants.length;
      newSplits = participants.map((participant) => ({
        userId: participant.id,
        name: participant.name,
        email: participant.email,
        imageUrl: participant.imageUrl,
        amount: shareAmount,
        percentage: 100 / participants.length,
        paid: participant.id === paidByUserId,
      }));
    } else if (type === "percentage") {
      // Initialize percentage splits evenly
      const evenPercentage = 100 / participants.length;
      newSplits = participants.map((participant) => ({
        userId: participant.id,
        name: participant.name,
        email: participant.email,
        imageUrl: participant.imageUrl,
        amount: (amount * evenPercentage) / 100,
        percentage: evenPercentage,
        paid: participant.id === paidByUserId,
      }));
    } else if (type === "exact") {
      // Initialize exact splits evenly
      const evenAmount = amount / participants.length;
      newSplits = participants.map((participant) => ({
        userId: participant.id,
        name: participant.name,
        email: participant.email,
        imageUrl: participant.imageUrl,
        amount: evenAmount,
        percentage: (evenAmount / amount) * 100,
        paid: participant.id === paidByUserId,
      }));
    }

    setSplits(newSplits);

    // Calculate totals
    const newTotalAmount = newSplits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    const newTotalPercentage = newSplits.reduce(
      (sum, split) => sum + split.percentage,
      0
    );

    setTotalAmount(newTotalAmount);
    setTotalPercentage(newTotalPercentage);

    // Notify parent about the split changes
    if (onSplitsChange) {
      onSplitsChange(newSplits);
    }
  }, [type, amount, participants, paidByUserId, onSplitsChange]);

  // Update the percentage splits - no automatic adjustment of other values
  const updatePercentageSplit = (userId, newPercentage) => {
    // Update just this user's percentage and recalculate amount
    const updatedSplits = splits.map((split) => {
      if (split.userId === userId) {
        return {
          ...split,
          percentage: newPercentage,
          amount: (amount * newPercentage) / 100,
        };
      }
      return split;
    });

    setSplits(updatedSplits);

    // Recalculate totals
    const newTotalAmount = updatedSplits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    const newTotalPercentage = updatedSplits.reduce(
      (sum, split) => sum + split.percentage,
      0
    );

    setTotalAmount(newTotalAmount);
    setTotalPercentage(newTotalPercentage);

    // Notify parent about the split changes
    if (onSplitsChange) {
      onSplitsChange(updatedSplits);
    }
  };

  // Update the exact amount splits - no automatic adjustment of other values
  const updateExactSplit = (userId, newAmount) => {
    const parsedAmount = parseFloat(newAmount) || 0;

    // Update just this user's amount and recalculate percentage
    const updatedSplits = splits.map((split) => {
      if (split.userId === userId) {
        return {
          ...split,
          amount: parsedAmount,
          percentage: amount > 0 ? (parsedAmount / amount) * 100 : 0,
        };
      }
      return split;
    });

    setSplits(updatedSplits);

    // Recalculate totals
    const newTotalAmount = updatedSplits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    const newTotalPercentage = updatedSplits.reduce(
      (sum, split) => sum + split.percentage,
      0
    );

    setTotalAmount(newTotalAmount);
    setTotalPercentage(newTotalPercentage);

    // Notify parent about the split changes
    if (onSplitsChange) {
      onSplitsChange(updatedSplits);
    }
  };

  // Check if totals are valid
  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.01;
  const isAmountValid = Math.abs(totalAmount - amount) < 0.01;

  return (
    <div>
      {splits.map((split) => (
        <div
        key={split.userId}
        className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 max-w-[120px]">
            <Avatar className='h-7 w-7'>
              <AvatarImage src={split.imageUrl} />
              <AvatarFallback>{split.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {split.userId === user?.id ? "You" : split.name}
            </span>
          </div>
          {type === "equal" && (
            <div className="text-right text-sm">
              ₹{split.amount.toFixed(2)} ({split.percentage.toFixed(1)}%)
            </div>
          )}
        </div>
      ))}
    </div>
  );
}