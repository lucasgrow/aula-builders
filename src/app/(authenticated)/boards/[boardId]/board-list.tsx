"use client";

import React, { useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { BoardCard } from "./board-card";
import type { ListData } from "./board-canvas";

interface Props {
  list: ListData;
  index: number;
  onAddCard: (listId: string, title: string) => void;
  onCardClick: (cardId: string) => void;
}

export function BoardList({ list, index, onAddCard, onCardClick }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  function handleAdd() {
    if (!newTitle.trim()) return;
    onAddCard(list.id, newTitle.trim());
    setNewTitle("");
    setIsAdding(false);
  }

  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="w-[272px] flex-shrink-0 flex flex-col max-h-full"
        >
          <div
            {...provided.dragHandleProps}
            className="rounded-t-xl bg-content1 border border-divider border-b-0 px-3 py-2.5 flex items-center justify-between"
          >
            <h3 className="text-small font-semibold truncate">{list.title}</h3>
            <span className="text-tiny text-default-400 ml-2">{list.cards.length}</span>
          </div>

          <Droppable droppableId={list.id} type="CARD">
            {(dropProvided, snapshot) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={`flex-1 overflow-y-auto bg-content1 border-x border-divider px-2 py-1 min-h-[40px] ${
                  snapshot.isDraggingOver ? "bg-primary-50/50 dark:bg-primary-50/10" : ""
                }`}
              >
                {list.cards.map((card, cardIndex) => (
                  <BoardCard
                    key={card.id}
                    card={card}
                    index={cardIndex}
                    onClick={() => onCardClick(card.id)}
                  />
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="rounded-b-xl bg-content1 border border-divider border-t-0 px-2 py-2">
            {isAdding ? (
              <div className="flex flex-col gap-2">
                <Input
                  size="sm"
                  placeholder="Enter a title for this card..."
                  value={newTitle}
                  onValueChange={setNewTitle}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") setIsAdding(false);
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" color="primary" onPress={handleAdd} isDisabled={!newTitle.trim()}>
                    Add card
                  </Button>
                  <Button size="sm" variant="light" isIconOnly onPress={() => setIsAdding(false)}>
                    <Icon icon="solar:close-circle-linear" width={18} />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="light"
                size="sm"
                className="w-full justify-start text-default-500"
                startContent={<Icon icon="solar:add-circle-linear" width={18} />}
                onPress={() => setIsAdding(true)}
              >
                Add a card
              </Button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
