import { CreateRoomForm } from "@/components/create-room/CreateRoomForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Planning Poker XCL</CardTitle>
          <p className="text-sm text-muted-foreground">
            Crie uma sala para estimar histórias com o seu time.
          </p>
        </CardHeader>
        <CardContent>
          <CreateRoomForm />
        </CardContent>
      </Card>
    </div>
  );
}
