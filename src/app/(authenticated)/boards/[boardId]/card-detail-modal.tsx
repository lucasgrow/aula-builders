"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Input,
  Spinner,
  Chip,
  Textarea,
  Avatar,
  Checkbox,
  Progress,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { BoardMember, LabelData } from "./board-canvas";

interface CardDetail {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  coverColor: string | null;
  labels: { id: string; labelId: string; label?: { id: string; name: string; color: string } }[];
  members: { id: string; userId: string; user: { id: string; name: string | null; email: string; image: string | null } }[];
  checklists: {
    id: string;
    title: string;
    position: number;
    items: { id: string; title: string; isChecked: boolean; position: number }[];
  }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string | null; email: string; image: string | null };
  }[];
  attachments: {
    id: string;
    filename: string;
    originalFilename: string;
    contentType: string;
    size: number;
    createdAt: string;
  }[];
}

interface Props {
  boardId: string;
  cardId: string | null;
  labels: LabelData[];
  members: BoardMember[];
  onClose: () => void;
  onUpdate: () => void;
}

export function CardDetailModal({ boardId, cardId, labels, members, onClose, onUpdate }: Props) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");

  const fetchCard = useCallback(async () => {
    if (!cardId) return;
    setLoading(true);
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}`);
    if (res.ok) {
      const data: any = await res.json();
      const merged = {
        ...data.card,
        labels: data.labels ?? [],
        members: data.members ?? [],
        checklists: data.checklists ?? [],
        comments: data.comments ?? [],
        attachments: data.attachments ?? [],
      };
      setCard(merged);
      setTitle(merged.title);
      setDescription(merged.description ?? "");
    }
    setLoading(false);
  }, [boardId, cardId]);

  useEffect(() => {
    if (cardId) fetchCard();
    else setCard(null);
  }, [cardId, fetchCard]);

  async function updateCard(updates: Record<string, unknown>) {
    if (!cardId) return;
    await fetch(`/api/boards/${boardId}/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchCard();
    onUpdate();
  }

  async function handleSaveTitle() {
    if (title.trim() && title.trim() !== card?.title) {
      await updateCard({ title: title.trim() });
    }
    setEditingTitle(false);
  }

  async function handleSaveDescription() {
    await updateCard({ description: description.trim() || null });
    setEditingDesc(false);
  }

  async function toggleLabel(labelId: string) {
    if (!cardId) return;
    const hasLabel = card?.labels.some((l) => l.labelId === labelId || l.label?.id === labelId);
    if (hasLabel) {
      await fetch(`/api/boards/${boardId}/cards/${cardId}/labels`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId }),
      });
    } else {
      await fetch(`/api/boards/${boardId}/cards/${cardId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId }),
      });
    }
    fetchCard();
    onUpdate();
  }

  async function toggleMember(userId: string) {
    if (!cardId) return;
    const hasMember = card?.members.some((m) => m.userId === userId);
    if (hasMember) {
      await fetch(`/api/boards/${boardId}/cards/${cardId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } else {
      await fetch(`/api/boards/${boardId}/cards/${cardId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    }
    fetchCard();
    onUpdate();
  }

  async function handleAddComment() {
    if (!cardId || !newComment.trim()) return;
    await fetch(`/api/boards/${boardId}/cards/${cardId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment.trim() }),
    });
    setNewComment("");
    fetchCard();
  }

  async function handleDeleteComment(commentId: string) {
    if (!cardId) return;
    await fetch(`/api/boards/${boardId}/cards/${cardId}/comments/${commentId}`, {
      method: "DELETE",
    });
    fetchCard();
  }

  async function handleAddChecklist() {
    if (!cardId || !newChecklistTitle.trim()) return;
    await fetch(`/api/boards/${boardId}/cards/${cardId}/checklists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newChecklistTitle.trim() }),
    });
    setNewChecklistTitle("");
    fetchCard();
  }

  async function handleToggleChecklistItem(checklistId: string, itemId: string, isChecked: boolean) {
    if (!cardId) return;
    await fetch(`/api/boards/${boardId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isChecked: !isChecked }),
    });
    fetchCard();
  }

  async function handleAddChecklistItem(checklistId: string, title: string) {
    if (!cardId) return;
    await fetch(`/api/boards/${boardId}/cards/${cardId}/checklists/${checklistId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    fetchCard();
  }

  async function handleDeleteChecklist(checklistId: string) {
    if (!cardId) return;
    await fetch(`/api/boards/${boardId}/cards/${cardId}/checklists/${checklistId}`, {
      method: "DELETE",
    });
    fetchCard();
  }

  async function handleSetDueDate(date: string | null) {
    await updateCard({ dueDate: date });
  }

  async function handleDeleteCard() {
    if (!cardId) return;
    await fetch(`/api/boards/${boardId}/cards/${cardId}`, { method: "DELETE" });
    onClose();
    onUpdate();
  }

  return (
    <Modal isOpen={!!cardId} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {loading || !card ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <ModalHeader className="flex-col items-start gap-1 pb-0">
              {/* Cover color */}
              {card.coverColor && (
                <div
                  className="w-full h-16 -mt-4 -mx-6 mb-2 rounded-t-xl"
                  style={{ backgroundColor: card.coverColor, width: "calc(100% + 3rem)" }}
                />
              )}
              {editingTitle ? (
                <Input
                  value={title}
                  onValueChange={setTitle}
                  autoFocus
                  classNames={{ input: "text-lg font-semibold" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") {
                      setTitle(card.title);
                      setEditingTitle(false);
                    }
                  }}
                  onBlur={handleSaveTitle}
                />
              ) : (
                <button
                  className="text-lg font-semibold hover:bg-default-100 rounded-lg px-2 py-1 -ml-2 transition-colors text-left w-full"
                  onClick={() => setEditingTitle(true)}
                >
                  {card.title}
                </button>
              )}
            </ModalHeader>
            <ModalBody className="pb-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Main content */}
                <div className="flex-1 min-w-0 space-y-6">
                  {/* Labels */}
                  {card.labels.length > 0 && (
                    <div>
                      <p className="text-tiny font-semibold text-default-500 mb-1.5">ETIQUETAS</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {card.labels.map((cl) => {
                          const lbl = cl.label ?? labels.find((l) => l.id === cl.labelId);
                          if (!lbl) return null;
                          return (
                            <Chip
                              key={cl.id}
                              size="sm"
                              style={{ backgroundColor: lbl.color, color: "#fff" }}
                            >
                              {lbl.name}
                            </Chip>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Members */}
                  {card.members.length > 0 && (
                    <div>
                      <p className="text-tiny font-semibold text-default-500 mb-1.5">MEMBROS</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {card.members.map((m) => (
                          <Avatar
                            key={m.id}
                            src={m.user.image ?? undefined}
                            name={m.user.name ?? m.user.email}
                            size="sm"
                            showFallback
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Due date */}
                  {card.dueDate && (
                    <div>
                      <p className="text-tiny font-semibold text-default-500 mb-1.5">DATA DE ENTREGA</p>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          new Date(card.dueDate) < new Date()
                            ? "danger"
                            : new Date(card.dueDate).getTime() - Date.now() < 86400000
                            ? "warning"
                            : "default"
                        }
                        startContent={<Icon icon="solar:calendar-linear" width={14} />}
                      >
                        {new Date(card.dueDate).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </Chip>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <p className="text-tiny font-semibold text-default-500 mb-1.5">DESCRICAO</p>
                    {editingDesc ? (
                      <div>
                        <Textarea
                          value={description}
                          onValueChange={setDescription}
                          autoFocus
                          minRows={3}
                          placeholder="Adicionar uma descricao mais detalhada..."
                        />
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" color="primary" onPress={handleSaveDescription}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => {
                              setDescription(card.description ?? "");
                              setEditingDesc(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="w-full text-left rounded-lg bg-default-100 p-3 text-small text-default-600 hover:bg-default-200 transition-colors min-h-[60px]"
                        onClick={() => setEditingDesc(true)}
                      >
                        {card.description || "Adicionar uma descricao mais detalhada..."}
                      </button>
                    )}
                  </div>

                  {/* Checklists */}
                  {card.checklists.map((cl) => {
                    const total = cl.items.length;
                    const checked = cl.items.filter((i) => i.isChecked).length;
                    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
                    return (
                      <div key={cl.id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:checklist-minimalistic-linear" width={18} className="text-default-500" />
                            <p className="text-small font-semibold">{cl.title}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => handleDeleteChecklist(cl.id)}
                          >
                            Delete
                          </Button>
                        </div>
                        {total > 0 && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-tiny text-default-500 w-8">{pct}%</span>
                            <Progress
                              size="sm"
                              value={pct}
                              color={pct === 100 ? "success" : "primary"}
                              className="flex-1"
                            />
                          </div>
                        )}
                        <div className="space-y-1">
                          {cl.items
                            .sort((a, b) => a.position - b.position)
                            .map((item) => (
                              <Checkbox
                                key={item.id}
                                isSelected={item.isChecked}
                                onValueChange={() =>
                                  handleToggleChecklistItem(cl.id, item.id, item.isChecked)
                                }
                                lineThrough
                                size="sm"
                              >
                                {item.title}
                              </Checkbox>
                            ))}
                        </div>
                        <ChecklistItemInput
                          onAdd={(t) => handleAddChecklistItem(cl.id, t)}
                        />
                      </div>
                    );
                  })}

                  {/* Comments */}
                  <div>
                    <p className="text-tiny font-semibold text-default-500 mb-2">ATIVIDADE</p>
                    <div className="flex gap-2 mb-4">
                      <Textarea
                        value={newComment}
                        onValueChange={setNewComment}
                        placeholder="Escrever um comentario..."
                        minRows={2}
                        size="sm"
                        className="flex-1"
                      />
                    </div>
                    {newComment.trim() && (
                      <Button
                        size="sm"
                        color="primary"
                        onPress={handleAddComment}
                        className="mb-4"
                      >
                        Save
                      </Button>
                    )}
                    <div className="space-y-3">
                      {card.comments.map((c) => (
                        <div key={c.id} className="flex gap-2">
                          <Avatar
                            src={c.user.image ?? undefined}
                            name={c.user.name ?? c.user.email}
                            size="sm"
                            showFallback
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-small font-medium">
                                {c.user.name ?? c.user.email}
                              </span>
                              <span className="text-tiny text-default-400">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-small text-default-600 mt-0.5">
                              {c.content}
                            </p>
                            <Button
                              size="sm"
                              variant="light"
                              className="text-tiny text-default-400 p-0 h-auto min-w-0"
                              onPress={() => handleDeleteComment(c.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar actions */}
                <div className="w-full md:w-44 space-y-2 flex-shrink-0">
                  <p className="text-tiny font-semibold text-default-500 mb-1">ADICIONAR AO CARD</p>

                  {/* Labels popover */}
                  <Popover placement="left">
                    <PopoverTrigger>
                      <Button
                        variant="flat"
                        size="sm"
                        className="w-full justify-start"
                        startContent={<Icon icon="solar:tag-linear" width={16} />}
                      >
                        Etiquetas
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-3 w-56">
                      <p className="text-small font-semibold mb-2">Etiquetas</p>
                      <div className="space-y-1">
                        {labels.map((l) => {
                          const active = card.labels.some(
                            (cl) => cl.labelId === l.id || cl.label?.id === l.id
                          );
                          return (
                            <button
                              key={l.id}
                              className={`flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-small transition-colors ${
                                active ? "ring-2 ring-primary" : "hover:bg-default-100"
                              }`}
                              onClick={() => toggleLabel(l.id)}
                            >
                              <span
                                className="h-6 flex-1 rounded"
                                style={{ backgroundColor: l.color }}
                              />
                              <span className="text-tiny truncate max-w-[80px]">{l.name}</span>
                              {active && <Icon icon="solar:check-circle-bold" width={16} className="text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Members popover */}
                  <Popover placement="left">
                    <PopoverTrigger>
                      <Button
                        variant="flat"
                        size="sm"
                        className="w-full justify-start"
                        startContent={<Icon icon="solar:user-plus-linear" width={16} />}
                      >
                        Membros
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-3 w-56">
                      <p className="text-small font-semibold mb-2">Membros</p>
                      <div className="space-y-1">
                        {members.map((m) => {
                          const active = card.members.some((cm) => cm.userId === m.user.id);
                          return (
                            <button
                              key={m.id}
                              className={`flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-small transition-colors ${
                                active ? "bg-primary-50" : "hover:bg-default-100"
                              }`}
                              onClick={() => toggleMember(m.user.id)}
                            >
                              <Avatar
                                src={m.user.image ?? undefined}
                                name={m.user.name ?? m.user.email}
                                size="sm"
                                showFallback
                              />
                              <span className="truncate text-small">
                                {m.user.name ?? m.user.email}
                              </span>
                              {active && <Icon icon="solar:check-circle-bold" width={16} className="text-primary ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Checklist */}
                  <Popover placement="left">
                    <PopoverTrigger>
                      <Button
                        variant="flat"
                        size="sm"
                        className="w-full justify-start"
                        startContent={<Icon icon="solar:checklist-minimalistic-linear" width={16} />}
                      >
                        Checklist
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-3 w-56">
                      <p className="text-small font-semibold mb-2">Adicionar checklist</p>
                      <Input
                        size="sm"
                        placeholder="Titulo"
                        value={newChecklistTitle}
                        onValueChange={setNewChecklistTitle}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddChecklist();
                        }}
                      />
                      <Button
                        size="sm"
                        color="primary"
                        className="mt-2 w-full"
                        onPress={handleAddChecklist}
                        isDisabled={!newChecklistTitle.trim()}
                      >
                        Adicionar
                      </Button>
                    </PopoverContent>
                  </Popover>

                  {/* Due date */}
                  <Popover placement="left">
                    <PopoverTrigger>
                      <Button
                        variant="flat"
                        size="sm"
                        className="w-full justify-start"
                        startContent={<Icon icon="solar:calendar-linear" width={16} />}
                      >
                        Data de entrega
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-3 w-56">
                      <p className="text-small font-semibold mb-2">Data de entrega</p>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-divider bg-default-100 px-3 py-2 text-small"
                        value={card.dueDate ? new Date(card.dueDate).toISOString().split("T")[0] : ""}
                        onChange={(e) => handleSetDueDate(e.target.value || null)}
                      />
                      {card.dueDate && (
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          className="mt-2 w-full"
                          onPress={() => handleSetDueDate(null)}
                        >
                          Remover
                        </Button>
                      )}
                    </PopoverContent>
                  </Popover>

                  {/* Cover color */}
                  <Popover placement="left">
                    <PopoverTrigger>
                      <Button
                        variant="flat"
                        size="sm"
                        className="w-full justify-start"
                        startContent={<Icon icon="solar:palette-round-linear" width={16} />}
                      >
                        Capa
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-3 w-56">
                      <p className="text-small font-semibold mb-2">Cor da capa</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {["#EF4444", "#F97316", "#FBBF24", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280"].map(
                          (c) => (
                            <button
                              key={c}
                              className="h-8 rounded-lg transition-transform hover:scale-110"
                              style={{
                                backgroundColor: c,
                                outline: card.coverColor === c ? "2px solid currentColor" : "none",
                                outlineOffset: "2px",
                              }}
                              onClick={() => updateCard({ coverColor: c })}
                            />
                          )
                        )}
                      </div>
                      {card.coverColor && (
                        <Button
                          size="sm"
                          variant="flat"
                          className="mt-2 w-full"
                          onPress={() => updateCard({ coverColor: null })}
                        >
                          Remover capa
                        </Button>
                      )}
                    </PopoverContent>
                  </Popover>

                  <div className="pt-2">
                    <p className="text-tiny font-semibold text-default-500 mb-1">ACOES</p>
                    <Button
                      variant="flat"
                      size="sm"
                      color="danger"
                      className="w-full justify-start"
                      startContent={<Icon icon="solar:trash-bin-trash-linear" width={16} />}
                      onPress={handleDeleteCard}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

function ChecklistItemInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  if (!adding) {
    return (
      <Button
        size="sm"
        variant="flat"
        className="mt-1"
        onPress={() => setAdding(true)}
        startContent={<Icon icon="solar:add-circle-linear" width={14} />}
      >
        Add an item
      </Button>
    );
  }

  return (
    <div className="mt-1 flex gap-2">
      <Input
        size="sm"
        placeholder="Add an item"
        value={value}
        onValueChange={setValue}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onAdd(value.trim());
            setValue("");
          }
          if (e.key === "Escape") setAdding(false);
        }}
        className="flex-1"
      />
      <Button
        size="sm"
        color="primary"
        onPress={() => {
          if (value.trim()) {
            onAdd(value.trim());
            setValue("");
          }
        }}
        isDisabled={!value.trim()}
      >
        Add
      </Button>
    </div>
  );
}
