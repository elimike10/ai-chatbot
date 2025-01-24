'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { memo, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { debounce } from 'lodash';

import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { Chat } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { useChatVisibility } from '@/hooks/use-chat-visibility';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibility: chat.visibility,
  });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <span>{chat.title}</span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('private');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <LockIcon size={12} />
                    <span>Private</span>
                  </div>
                  {visibilityType === 'private' ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('public');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === 'public' ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});

export function SidebarHistory({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { setOpenMobile } = useSidebar();

  // Fetch chat history only if user is authenticated
  const { data: chats, mutate: mutateChats, error, isLoading } = useSWR<Chat[]>(
    user ? '/api/history' : null,
    fetcher,
    {
      fallbackData: [],
    }
  );

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const handleDeleteChat = useCallback(async () => {
    if (!chatToDelete || !user) return;

    try {
      const response = await fetch(`/api/history/${chatToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Update local state after successful deletion
      mutateChats(
        (chats) => chats?.filter((chat) => chat.id !== chatToDelete) ?? [],
        false
      );

      // Redirect to home if the deleted chat was the current one
      if (params?.id === chatToDelete) {
        router.push('/');
      }

      setIsDeleteDialogOpen(false);
      setIsConfirmDialogOpen(false);
      setChatToDelete(null);
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  }, [chatToDelete, user, mutateChats, params, router]);

  const debouncedHandleDeleteChat = useCallback(
    debounce(handleDeleteChat, 300),
    [handleDeleteChat]
  );

  const onDelete = useCallback((chatId: string) => {
    setIsConfirmDialogOpen(true);
    setChatToDelete(chatId);
  }, []);

  const onConfirmDelete = useCallback(() => {
    setIsConfirmDialogOpen(false);
    setIsDeleteDialogOpen(true);
    debouncedHandleDeleteChat();
  }, [debouncedHandleDeleteChat]);

  // Group chats by date
  const groupedChats = chats?.reduce<GroupedChats>(
    (groups, chat) => {
      const date = new Date(chat.createdAt);
      if (isToday(date)) {
        groups.today.push(chat);
      } else if (isYesterday(date)) {
        groups.yesterday.push(chat);
      } else if (date > subWeeks(new Date(), 1)) {
        groups.lastWeek.push(chat);
      } else if (date > subMonths(new Date(), 1)) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }
      return groups;
    },
    { today: [], yesterday: [], lastWeek: [], lastMonth: [], older: [] }
  ) ?? { today: [], yesterday: [], lastWeek: [], lastMonth: [], older: [] };

  // Handle different states
  if (!user) {
    return (
      <div className="px-4 py-2 text-sm text-sidebar-foreground/50">
        Log in to view chat history
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-sm text-sidebar-foreground/50">
        Loading chat history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-2 text-sm text-sidebar-foreground/50">
        Error loading chat history. Please try again.
      </div>
    );
  }

  if (chats?.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-sidebar-foreground/50">
        No chat history available.
      </div>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {Object.entries(groupedChats).map(([group, groupChats]) => {
              if (groupChats.length === 0) return null;
              return (
                <div key={group}>
                  <div className="px-2 py-1 text-xs font-semibold text-sidebar-foreground/50">
                    {group}
                  </div>
                  {groupChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={pathname === `/chat/${chat.id}`}
                      onDelete={onDelete}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your chat message and remove your
              data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    mutateChats(
      (chats) => chats?.filter((chat) => chat.id !== chatToDelete) ?? [],
      false
    );

    if (params?.id === chatToDelete) {
      router.push('/');
    }

    setIsDeleteDialogOpen(false);
    setChatToDelete(null);
    toast.success('Chat deleted');
  };

  const onDelete = (chatId: string) => {
    setIsDeleteDialogOpen(true);
    setChatToDelete(chatId);
  };

  const groupedChats = chats.reduce<GroupedChats>(
    (groups, chat) => {
      const date = new Date(chat.createdAt);
      if (isToday(date)) {
        groups.today.push(chat);
      } else if (isYesterday(date)) {
        groups.yesterday.push(chat);
      } else if (date > subWeeks(new Date(), 1)) {
        groups.lastWeek.push(chat);
      } else if (date > subMonths(new Date(), 1)) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }
      return groups;
    },
    { today: [], yesterday: [], lastWeek: [], lastMonth: [], older: [] }
  );

  if (!user) {
    return (
      <div className="px-4 py-2 text-sm text-sidebar-foreground/50">
        Log in to view chat history
      </div>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {Object.entries(groupedChats).map(([group, groupChats]) => {
              if (groupChats.length === 0) return null;
              return (
                <div key={group}>
                  <div className="px-2 py-1 text-xs font-semibold text-sidebar-foreground/50">
                    {group}
                  </div>
                  {groupChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={pathname === `/chat/${chat.id}`}
                      onDelete={onDelete}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your chat message and remove your
              data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function SidebarHistory({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { setOpenMobile } = useSidebar();

  const { data: chats, mutate: mutateChats } = useSWR<Chat[]>(
    user ? '/api/history' : null,
    fetcher,
    {
      fallbackData: [],
    }
  );

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const handleDeleteChat = async () => {
    if (!chatToDelete || !user) return;

    const response = await fetch(`/api/history/${chatToDelete}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      toast.error('Failed to delete chat');
      return;
    }

    mutateChats(
      (chats) => chats?.filter((chat) => chat.id !== chatToDelete) ?? [],
      false
    );

    if (params?.id === chatToDelete) {
      router.push('/');
    }

    setIsDeleteDialogOpen(false);
    setChatToDelete(null);
    toast.success('Chat deleted');
  };

  const onDelete = (chatId: string) => {
    setIsDeleteDialogOpen(true);
    setChatToDelete(chatId);
  };

  const groupedChats = chats.reduce<GroupedChats>(
    (groups, chat) => {
      const date = new Date(chat.createdAt);
      if (isToday(date)) {
        groups.today.push(chat);
      } else if (isYesterday(date)) {
        groups.yesterday.push(chat);
      } else if (date > subWeeks(new Date(), 1)) {
        groups.lastWeek.push(chat);
      } else if (date > subMonths(new Date(), 1)) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }
      return groups;
    },
    { today: [], yesterday: [], lastWeek: [], lastMonth: [], older: [] }
  );

  if (!user) {
    return (
      <div className="px-4 py-2 text-sm text-sidebar-foreground/50">
        Log in to view chat history
      </div>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {Object.entries(groupedChats).map(([group, groupChats]) => {
              if (groupChats.length === 0) return null;
              return (
                <div key={group}>
                  <div className="px-2 py-1 text-xs font-semibold text-sidebar-foreground/50">
                    {group}
                  </div>
                  {groupChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={pathname === `/chat/${chat.id}`}
                      onDelete={onDelete}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your chat message and remove your
              data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
  const { id } = useParams();
  const pathname = usePathname();
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<Chat>>(user ? '/api/history' : null, fetcher, {
    fallbackData: [],
  });

  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        mutate((history) => {
          if (history) {
            return history.filter((h) => h.id !== id);
          }
        });
        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push('/');
    }
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (history?.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const groupChatsByDate = (chats: Chat[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
      (groups, chat) => {
        const chatDate = new Date(chat.createdAt);

        if (isToday(chatDate)) {
          groups.today.push(chat);
        } else if (isYesterday(chatDate)) {
          groups.yesterday.push(chat);
        } else if (chatDate > oneWeekAgo) {
          groups.lastWeek.push(chat);
        } else if (chatDate > oneMonthAgo) {
          groups.lastMonth.push(chat);
        } else {
          groups.older.push(chat);
        }

        return groups;
      },
      {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      } as GroupedChats,
    );
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {history &&
              (() => {
                const groupedChats = groupChatsByDate(history);

                return (
                  <>
                    {groupedChats.today.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Today
                        </div>
                        {groupedChats.today.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.yesterday.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Yesterday
                        </div>
                        {groupedChats.yesterday.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.lastWeek.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Last 7 days
                        </div>
                        {groupedChats.lastWeek.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.lastMonth.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Last 30 days
                        </div>
                        {groupedChats.lastMonth.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.older.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                          Older
                        </div>
                        {groupedChats.older.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
