"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

interface Board {
  id: string;
  name: string;
  description: string | null;
  background: string;
  memberCount: number;
  createdAt: string;
}

const BACKGROUND_COLORS = [
  "#059669", "#3B82F6", "#8B5CF6", "#EC4899",
  "#F97316", "#EF4444", "#14B8A6", "#6366F1",
];

export function BoardsClient() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [background, setBackground] = useState(BACKGROUND_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const fetchBoards = useCallback(async () => {
    const res = await fetch("/api/boards");
    const data: any = await res.json();
    setBoards(data.boards ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, background }),
    });
    if (res.ok) {
      setName("");
      setDescription("");
      setBackground(BACKGROUND_COLORS[0]);
      onClose();
      fetchBoards();
    }
    setCreating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Boards</h1>
        <Button color="primary" onPress={onOpen} startContent={<Icon icon="solar:add-circle-linear" width={20} />}>
          Create board
        </Button>
      </div>

      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-50/20">
            <Icon icon="solar:widget-5-linear" width={32} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">No boards yet</h2>
          <p className="text-default-500 max-w-sm">Create your first board to start organizing your work.</p>
          <Button color="primary" onPress={onOpen}>Create board</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((b) => (
            <Card
              key={b.id}
              as={Link}
              href={`/boards/${b.id}`}
              isPressable
              className="border border-divider hover:shadow-apple-md transition-shadow"
            >
              <div className="h-24 rounded-t-xl" style={{ backgroundColor: b.background }} />
              <CardBody className="p-4">
                <h3 className="font-semibold truncate">{b.name}</h3>
                {b.description && (
                  <p className="text-small text-default-500 truncate mt-1">{b.description}</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={onClose} placement="center">
        <ModalContent>
          <ModalHeader>Create board</ModalHeader>
          <ModalBody>
            <Input
              label="Board name"
              placeholder="e.g. Product Roadmap"
              value={name}
              onValueChange={setName}
              autoFocus
            />
            <Input
              label="Description"
              placeholder="Optional"
              value={description}
              onValueChange={setDescription}
            />
            <div>
              <p className="text-small font-medium mb-2">Background</p>
              <div className="flex gap-2 flex-wrap">
                {BACKGROUND_COLORS.map((c) => (
                  <button
                    key={c}
                    className="h-8 w-8 rounded-lg transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      outline: background === c ? "2px solid currentColor" : "none",
                      outlineOffset: "2px",
                    }}
                    onClick={() => setBackground(c)}
                  />
                ))}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>Cancel</Button>
            <Button color="primary" onPress={handleCreate} isLoading={creating} isDisabled={!name.trim()}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
