"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Spinner } from "@heroui/react";
import { BoardHeader } from "./board-header";
import { BoardList } from "./board-list";
import { CreateListForm } from "./create-list-form";
import { CardDetailModal } from "./card-detail-modal";

export interface CardLabel {
  id: string;
  name: string;
  color: string;
}

export interface CardData {
  id: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  coverColor: string | null;
  labels: CardLabel[];
  memberCount: number;
  memberIds?: string[];
}

export interface ListData {
  id: string;
  title: string;
  position: number;
  cards: CardData[];
}

export interface BoardMember {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

export interface LabelData {
  id: string;
  name: string;
  color: string;
}

interface BoardData {
  id: string;
  name: string;
  description: string | null;
  background: string;
  ownerId: string;
}

export function BoardCanvas({ boardId }: { boardId: string }) {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [lists, setLists] = useState<ListData[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLabelIds, setFilterLabelIds] = useState<string[]>([]);
  const [filterMemberIds, setFilterMemberIds] = useState<string[]>([]);

  const fetchBoard = useCallback(async () => {
    const res = await fetch(`/api/boards/${boardId}`);
    if (!res.ok) return;
    const data: any = await res.json();
    setBoard(data.board);
    setLists(data.lists ?? []);
    setMembers(data.members ?? []);
    setLabels(data.labels ?? []);
    setLoading(false);
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") setSelectedCardId(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered lists
  const filteredLists = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const hasFilters = q || filterLabelIds.length > 0 || filterMemberIds.length > 0;
    if (!hasFilters) return lists;

    return lists.map((l) => ({
      ...l,
      cards: l.cards.filter((c) => {
        if (q && !c.title.toLowerCase().includes(q)) return false;
        if (filterLabelIds.length > 0 && !c.labels.some((cl) => filterLabelIds.includes(cl.id))) return false;
        return true;
      }),
    }));
  }, [lists, searchQuery, filterLabelIds, filterMemberIds]);

  const toggleFilterLabel = useCallback((id: string) => {
    setFilterLabelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleFilterMember = useCallback((id: string) => {
    setFilterMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, type } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      if (type === "LIST") {
        const reordered = [...lists];
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);
        setLists(reordered);

        await fetch(`/api/boards/${boardId}/lists/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: reordered.map((l) => l.id) }),
        });
        return;
      }

      // Card drag
      const srcListId = source.droppableId;
      const dstListId = destination.droppableId;

      const newLists = lists.map((l) => ({ ...l, cards: [...l.cards] }));
      const srcList = newLists.find((l) => l.id === srcListId)!;
      const dstList = newLists.find((l) => l.id === dstListId)!;

      const [movedCard] = srcList.cards.splice(source.index, 1);
      dstList.cards.splice(destination.index, 0, movedCard);

      setLists(newLists);

      const cardsToUpdate = dstList.cards.map((c, i) => ({
        id: c.id,
        listId: dstListId,
        position: i,
      }));
      if (srcListId !== dstListId) {
        srcList.cards.forEach((c, i) => {
          cardsToUpdate.push({ id: c.id, listId: srcListId, position: i });
        });
      }

      await fetch(`/api/boards/${boardId}/cards/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: cardsToUpdate }),
      });
    },
    [lists, boardId]
  );

  const handleAddCard = useCallback(
    async (listId: string, title: string) => {
      const res = await fetch(`/api/boards/${boardId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId, title }),
      });
      if (res.ok) {
        const data: any = await res.json();
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? { ...l, cards: [...l.cards, { ...data.card, labels: [], memberCount: 0 }] }
              : l
          )
        );
      }
    },
    [boardId]
  );

  const handleAddList = useCallback(
    async (title: string) => {
      const res = await fetch(`/api/boards/${boardId}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const data: any = await res.json();
        setLists((prev) => [...prev, { ...data.list, cards: [] }]);
      }
    },
    [boardId]
  );

  const handleUpdateBoard = useCallback(
    async (updates: Partial<BoardData>) => {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok && board) {
        setBoard({ ...board, ...updates });
      }
    },
    [boardId, board]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!board) {
    return <div className="py-20 text-center text-default-500">Board not found</div>;
  }

  return (
    <div className="-mx-4 -my-6 md:-mx-6 flex flex-col md:h-[calc(100dvh-4rem)]">
      <BoardHeader
        board={board}
        members={members}
        labels={labels}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterLabelIds={filterLabelIds}
        onToggleFilterLabel={toggleFilterLabel}
        filterMemberIds={filterMemberIds}
        onToggleFilterMember={toggleFilterMember}
        onUpdateBoard={handleUpdateBoard}
      />

      <div
        className="flex-1 overflow-x-auto md:overflow-y-hidden p-4 md:p-6 snap-x snap-mandatory md:snap-none scroll-px-4 md:scroll-px-6"
        style={{ backgroundColor: board.background + "15" }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" type="LIST" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-4 items-start md:h-full"
              >
                {filteredLists.map((list, index) => (
                  <BoardList
                    key={list.id}
                    list={list}
                    index={index}
                    onAddCard={handleAddCard}
                    onCardClick={setSelectedCardId}
                  />
                ))}
                {provided.placeholder}
                <CreateListForm onAdd={handleAddList} />
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <CardDetailModal
        boardId={boardId}
        cardId={selectedCardId}
        labels={labels}
        members={members}
        onClose={() => setSelectedCardId(null)}
        onUpdate={fetchBoard}
      />
    </div>
  );
}
