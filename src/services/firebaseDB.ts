import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const getUser = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.data();
};

const addUser = async (uid: string, firstName: string) => {
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, { firstName, createdAt: new Date() });
};

export { getUser, addUser };
