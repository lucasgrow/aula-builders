"use client";

import React, { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";

interface Props {
  onAdd: (title: string) => void;
}

export function CreateListForm({ onAdd }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  function handleAdd() {
    if (!title.trim()) return;
    onAdd(title.trim());
    setTitle("");
    setIsAdding(false);
  }

  if (!isAdding) {
    return (
      <div className="w-[272px] flex-shrink-0">
        <Button
          variant="flat"
          className="w-full justify-start bg-content1/80 backdrop-blur-sm"
          startContent={<Icon icon="solar:add-circle-linear" width={18} />}
          onPress={() => setIsAdding(true)}
        >
          Add another list
        </Button>
      </div>
    );
  }

  return (
    <div className="w-[272px] flex-shrink-0 rounded-xl bg-content1 border border-divider p-3">
      <Input
        size="sm"
        placeholder="Enter list title..."
        value={title}
        onValueChange={setTitle}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") setIsAdding(false);
        }}
      />
      <div className="flex gap-2 mt-2">
        <Button size="sm" color="primary" onPress={handleAdd} isDisabled={!title.trim()}>
          Add list
        </Button>
        <Button size="sm" variant="light" isIconOnly onPress={() => setIsAdding(false)}>
          <Icon icon="solar:close-circle-linear" width={18} />
        </Button>
      </div>
    </div>
  );
}
