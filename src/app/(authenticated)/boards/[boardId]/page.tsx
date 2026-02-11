import { BoardCanvas } from "./board-canvas";

export default function BoardPage({ params }: { params: { boardId: string } }) {
  return <BoardCanvas boardId={params.boardId} />;
}
