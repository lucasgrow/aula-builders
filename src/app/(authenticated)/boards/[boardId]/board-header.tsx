"use client";

import React, { useState } from "react";
import {
  Avatar,
  AvatarGroup,
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { BoardMember, LabelData } from "./board-canvas";

interface Props {
  board: { id: string; name: string; description: string | null; background: string };
  members: BoardMember[];
  labels: LabelData[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterLabelIds: string[];
  onToggleFilterLabel: (id: string) => void;
  filterMemberIds: string[];
  onToggleFilterMember: (id: string) => void;
  onUpdateBoard: (updates: Record<string, unknown>) => void;
}

export function BoardHeader({
  board,
  members,
  labels,
  searchQuery,
  onSearchChange,
  filterLabelIds,
  onToggleFilterLabel,
  filterMemberIds,
  onToggleFilterMember,
  onUpdateBoard,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(board.name);

  const activeFilters = filterLabelIds.length + filterMemberIds.length;

  function handleSave() {
    if (editName.trim() && editName.trim() !== board.name) {
      onUpdateBoard({ name: editName.trim() });
    }
    setIsEditing(false);
  }

  return (
    <div
      className="sticky top-16 z-30 px-4 py-2.5 md:px-6 border-b border-divider md:static"
      style={{ backgroundColor: board.background + "20" }}
    >
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <div className="flex items-center gap-2 min-w-0">
          {isEditing ? (
            <Input
              size="sm"
              value={editName}
              onValueChange={setEditName}
              autoFocus
              classNames={{ input: "font-semibold" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setEditName(board.name);
                  setIsEditing(false);
                }
              }}
              onBlur={handleSave}
              className="w-full md:max-w-xs"
            />
          ) : (
            <button
              className="min-w-0 truncate text-lg font-semibold hover:bg-default-100/50 rounded-lg px-2 py-1 transition-colors text-left"
              onClick={() => setIsEditing(true)}
            >
              {board.name}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 md:overflow-visible md:pb-0 md:-mx-0 md:px-0 md:flex-1 md:flex-wrap">
          {/* Search */}
          <Input
            size="sm"
            placeholder="Filtrar cards..."
            value={searchQuery}
            onValueChange={onSearchChange}
            startContent={<Icon icon="solar:magnifer-linear" width={16} className="text-default-400" />}
            className="w-52 lg:w-64 flex-shrink-0"
            isClearable
            onClear={() => onSearchChange("")}
          />

          {/* Filter by label */}
          <Popover placement="bottom">
            <PopoverTrigger>
              <Button
                size="sm"
                variant="flat"
                startContent={<Icon icon="solar:tag-linear" width={16} />}
                className="bg-content1/80 whitespace-nowrap flex-shrink-0"
              >
                Etiquetas {filterLabelIds.length > 0 && `(${filterLabelIds.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-3 w-52">
              <p className="text-small font-semibold mb-2">Filtrar por etiqueta</p>
              <div className="space-y-1">
                {labels.map((l) => {
                  const active = filterLabelIds.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      className={`flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-small transition-colors ${
                        active ? "ring-2 ring-primary" : "hover:bg-default-100"
                      }`}
                      onClick={() => onToggleFilterLabel(l.id)}
                    >
                      <span className="h-5 w-5 rounded" style={{ backgroundColor: l.color }} />
                      <span className="truncate">{l.name}</span>
                      {active && <Icon icon="solar:check-circle-bold" width={16} className="text-primary ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Filter by member */}
          <Popover placement="bottom">
            <PopoverTrigger>
              <Button
                size="sm"
                variant="flat"
                startContent={<Icon icon="solar:users-group-rounded-linear" width={16} />}
                className="bg-content1/80 whitespace-nowrap flex-shrink-0"
              >
                Membros {filterMemberIds.length > 0 && `(${filterMemberIds.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-3 w-52">
              <p className="text-small font-semibold mb-2">Filtrar por membro</p>
              <div className="space-y-1">
                {members.map((m) => {
                  const active = filterMemberIds.includes(m.user.id);
                  return (
                    <button
                      key={m.id}
                      className={`flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-small transition-colors ${
                        active ? "bg-primary-50" : "hover:bg-default-100"
                      }`}
                      onClick={() => onToggleFilterMember(m.user.id)}
                    >
                      <Avatar
                        src={m.user.image ?? undefined}
                        name={m.user.name ?? m.user.email}
                        size="sm"
                        showFallback
                        className="flex-shrink-0"
                      />
                      <span className="truncate">{m.user.name ?? m.user.email}</span>
                      {active && <Icon icon="solar:check-circle-bold" width={16} className="text-primary ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {activeFilters > 0 && (
            <Button
              size="sm"
              variant="light"
              color="danger"
              className="whitespace-nowrap flex-shrink-0"
              onPress={() => {
                filterLabelIds.forEach(onToggleFilterLabel);
                filterMemberIds.forEach(onToggleFilterMember);
                onSearchChange("");
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="hidden md:flex ml-auto items-center gap-3">
          <AvatarGroup max={5} size="sm">
            {members.map((m) => (
              <Avatar
                key={m.id}
                src={m.user.image ?? undefined}
                name={m.user.name ?? m.user.email}
                size="sm"
                showFallback
              />
            ))}
          </AvatarGroup>
        </div>
      </div>
    </div>
  );
}
