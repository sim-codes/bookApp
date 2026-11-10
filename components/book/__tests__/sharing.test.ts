import { sharingError, sharingFlags } from '../SharingFields';

describe('sharing rules', () => {
    it('asks for the rights confirmation before a book can be shared', () => {
        expect(sharingError({ isPublic: true, isShareable: true, rightsConfirmed: false })).not.toBeNull();
        expect(sharingError({ isPublic: true, isShareable: true, rightsConfirmed: true })).toBeNull();
        expect(sharingError({ isPublic: true, isShareable: false, rightsConfirmed: false })).toBeNull();
    });

    it('never saves a private book as shareable', () => {
        expect(sharingFlags({ isPublic: false, isShareable: true, rightsConfirmed: true })).toEqual({ isPublic: false, isShareable: false });
    });
});
