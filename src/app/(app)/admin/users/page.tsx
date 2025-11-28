'use client';

import AppLayout from "@/components/layout/AppLayout";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { User } from "@/lib/types";
import { collection, doc, updateDoc } from "firebase/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const handleRoleChange = (userId: string, newRole: 'user' | 'admin') => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    const updatedData = { role: newRole };
    
    updateDoc(userRef, updatedData)
      .then(() => {
          toast({
              title: "Role Updated",
              description: `User role has been successfully changed to ${newRole}.`,
          });
      })
      .catch((error) => {
          const contextualError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: updatedData,
          });
          errorEmitter.emit('permission-error', contextualError);
      });
  };

  const getStatusVariant = (status: User['status']): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
        case 'ACTIVE': return 'default';
        case 'LIMITED': return 'secondary';
        case 'SUSPENDED': return 'destructive';
        default: return 'secondary';
    }
  }

  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage user roles and statuses for the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow key="header-row">
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading users...</TableCell>
                </TableRow>
              )}
              {users && users.map(user => (
                <TableRow key={user.uid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatar} alt={user.displayName} />
                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => handleRoleChange(user.uid, 'user')}>
                          Make User
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleRoleChange(user.uid, 'admin')}>
                          Make Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
