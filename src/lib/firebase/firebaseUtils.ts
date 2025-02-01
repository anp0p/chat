import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export const createNewChat = async (userId: string) => {
  try {
    console.log('Creating new chat for user:', userId);
    const now = new Date();
    const chatData = {
      userId,
      title: 'New Chat',
      messages: [],
      createdAt: now,
      updatedAt: now
    };
    console.log('Chat data to be created:', chatData);
    
    const chatRef = await addDoc(collection(db, 'chats'), chatData);
    console.log('Created chat with ID:', chatRef.id);
    return chatRef.id;
  } catch (error) {
    console.error('Error creating new chat:', error);
    throw error;
  }
};

export const getUserChats = async (userId: string) => {
  try {
    console.log('Getting chats for user ID:', userId);
    
    // First try with the composite index
    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(chatsQuery);
      console.log('Query executed with composite index, number of docs:', querySnapshot.size);
      
      const chats = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          title: data.title || 'New Chat',
          messages: data.messages || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      });
      
      return chats;
    } catch (indexError: any) {
      // If we get a missing index error, fall back to basic query
      if (indexError.code === 'failed-precondition') {
        console.log('Falling back to basic query without ordering');
        const basicQuery = query(
          collection(db, 'chats'),
          where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(basicQuery);
        
        const chats = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            title: data.title || 'New Chat',
            messages: data.messages || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
        });

        // Sort in memory instead
        return chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      }
      throw indexError;
    }
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
};

export const updateChatMessages = async (chatId: string, messages: ChatMessage[]) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      messages,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating chat messages:', error);
    throw error;
  }
};

export const updateChatTitle = async (chatId: string, title: string) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      title,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating chat title:', error);
    throw error;
  }
};

export const deleteChat = async (chatId: string) => {
  try {
    await deleteDoc(doc(db, 'chats', chatId));
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};
