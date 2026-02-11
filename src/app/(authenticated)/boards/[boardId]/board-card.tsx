"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Icon } from "@iconify/react";
import type { CardData } from "./board-canvas";

interface Props {
  card: CardData;
  index: number;
  onClick: () => void;
}

export function BoardCard({ card, index, onClick }: Props) {
  const hasDueDate = !!card.dueDate;
  const isOverdue = hasDueDate && new Date(card.dueDate!) < new Date();
  const isDueSoon =
    hasDueDate &&
    !isOverdue &&
    new Date(card.dueDate!).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`rounded-lg border border-divider bg-background p-2.5 mb-1.5 cursor-pointer hover:border-primary/40 transition-colors ${
            snapshot.isDragging ? "shadow-apple-md rotate-2" : ""
          }`}
        >
          {/* Overdue badge */}
          {isOverdue && (
            <div className="flex items-center gap-1 text-tiny font-semibold text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-100/20 rounded px-2 py-0.5 mb-1.5 -mx-0.5 w-fit">
              <span>&#9888;&#65039;</span>
              <span>Atrasado!</span>
            </div>
          )}

          {/* Cover color */}
          {card.coverColor && !isOverdue && (
            <div
              className="h-8 -mx-2.5 -mt-2.5 mb-2 rounded-t-lg"
              style={{ backgroundColor: card.coverColor }}
            />
          )}
          {card.coverColor && isOverdue && (
            <div
              className="h-8 -mx-2.5 mb-2 rounded-lg"
              style={{ backgroundColor: card.coverColor }}
            />
          )}

          {/* Labels */}
          {card.labels.length > 0 && (
            <div className="flex gap-1 flex-wrap mb-1.5">
              {card.labels.map((l) => (
                <span
                  key={l.id}
                  className="inline-block h-2 w-10 rounded-full"
                  style={{ backgroundColor: l.color }}
                  title={l.name}
                />
              ))}
            </div>
          )}

          {/* Title */}
          <p className="text-small leading-snug">{card.title}</p>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {hasDueDate && (
              <span
                className={`flex items-center gap-1 text-tiny rounded px-1.5 py-0.5 ${
                  isOverdue
                    ? "bg-danger-100 text-danger-700 dark:bg-danger-50 dark:text-danger-400"
                    : isDueSoon
                    ? "bg-warning-100 text-warning-700 dark:bg-warning-50 dark:text-warning-400"
                    : "text-default-400"
                }`}
              >
                <Icon icon="solar:clock-circle-linear" width={12} />
                {new Date(card.dueDate!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            )}
            {card.description && (
              <Icon icon="solar:document-text-linear" width={14} className="text-default-400" />
            )}
            {card.memberCount > 0 && (
              <span className="flex items-center gap-0.5 text-tiny text-default-400 ml-auto">
                <Icon icon="solar:user-linear" width={12} />
                {card.memberCount}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
