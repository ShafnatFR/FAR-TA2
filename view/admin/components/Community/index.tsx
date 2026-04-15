
import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { UserData, FoodItem, ClaimHistoryItem } from '../../../../types';
import { UserList } from './UserList';

interface CommunityProps {
    users?: UserData[];
    setUsers?: React.Dispatch<React.SetStateAction<UserData[]>>;
    inventory?: FoodItem[];
    claims?: ClaimHistoryItem[];
    currentUser: UserData | null;
}

export const Community: React.FC<CommunityProps> = ({ 
    users = [],
    setUsers,
    inventory = [],
    claims = [],
    currentUser
}) => {
  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="animate-in fade-in space-y-4 pb-20 px-1">
      {setUsers && (
          <UserList 
            users={users} 
            setUsers={setUsers} 
            inventory={inventory} 
            claims={claims} 
            pendingCount={pendingCount} 
            currentUser={currentUser}
          />
      )}
    </div>
  );
};
