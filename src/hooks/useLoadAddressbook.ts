import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useCallback, useEffect } from "react";
import { setAddressbook } from "src/stores/slices/addressbookSlice";
import { useAppDispatch } from "src/stores/store";

/**
 * This hook requests the address book and stores it if the permission is granted.
 */
export const useLoadAddressbook = () => {
  const { sdk } = useSafeAppsSDK();
  const dispatch = useAppDispatch();

  const request = useCallback(async () => sdk.safe.requestAddressBook(), [sdk.safe]);

  useEffect(() => {
    let isMounted = true;

    request()
      .then((ab) => {
        if (isMounted) {
          dispatch(setAddressbook(ab));
        }
      })
      .catch(() => {
        console.error("Addressbook request was rejected.");
      });

    return () => {
      isMounted = false;
    };
  }, [request, dispatch]);
};
